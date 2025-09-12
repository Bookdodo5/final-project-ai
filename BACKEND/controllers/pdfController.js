import { generateId } from "../services/idGenerator.js";
import { createReadStream, unlinkSync, writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import http from 'http';
import https from 'https';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const PDF_EXTRACT_KEY = process.env.PDF_EXTRACT_KEY || 'YOUR_PDF_EXTRACT_KEY';

function fetchWithNative(url, options) {
    return new Promise((resolve, reject) => {
        const lib = url.startsWith('https') ? https : http;
        const req = lib.request(url, options, (res) => {
            const chunks = [];

            res.on('data', (chunk) => chunks.push(chunk));

            res.on('end', () => {
                const response = {
                    status: res.statusCode,
                    statusText: res.statusMessage,
                    headers: res.headers,
                    data: Buffer.concat(chunks)
                };

                resolve({
                    ok: res.statusCode >= 200 && res.statusCode < 300,
                    status: res.statusCode,
                    statusText: res.statusMessage,
                    headers: res.headers,
                    json: async () => JSON.parse(response.data.toString()),
                    text: async () => response.data.toString()
                });
            });
        });

        req.on('error', reject);

        if (options.body) {
            req.write(options.body);
        }

        req.end();
    });
}

/**
 * Extract text from PDF
 * @type {import("express").RequestHandler} 
 */
export const extractTextFromPdf = async (req, res) => {
    try {
        if (!req.body || !req.body.file) {
            return res.status(400).json({
                success: false,
                error: 'No file data received'
            });
        }

        // Handle base64 file data from the client
        const base64Data = req.body.file.replace(/^data:application\/pdf;base64,/, '');
        const buffer = Buffer.from(base64Data, 'base64');
        const tempFilePath = join(__dirname, `temp-${Date.now()}.pdf`);

        // Write the buffer to a temporary file
        writeFileSync(tempFilePath, buffer);

        // Create a simple form data for the PDF extraction API
        const boundary = `----WebKitFormBoundary${Math.random().toString(16).substr(2)}`;
        const eol = '\r\n';
        let data = [];

        // Add file part
        data.push(`--${boundary}${eol}`);
        data.push(`Content-Disposition: form-data; name="file"; filename="upload.pdf"${eol}`);
        data.push(`Content-Type: application/pdf${eol}${eol}`);
        data.push(buffer);
        data.push(eol);

        // Add other form fields
        const fields = {
            full_text: 'document',
            preserve_line_breaks: 'off',
            word_style: 'off',
            word_coordinates: 'off',
            output_type: 'json'
        };

        for (const [key, value] of Object.entries(fields)) {
            data.push(`--${boundary}${eol}`);
            data.push(`Content-Disposition: form-data; name="${key}"${eol}${eol}`);
            data.push(value);
            data.push(eol);
        }

        data.push(`--${boundary}--${eol}`);

        const requestData = Buffer.concat(data.map(part =>
            Buffer.isBuffer(part) ? part : Buffer.from(part, 'utf-8')
        ));

        // Make the request to the PDF extraction API
        const response = await fetchWithNative('https://api.pdfrest.com/extracted-text', {
            method: 'POST',
            headers: {
                'Api-Key': PDF_EXTRACT_KEY,
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Content-Length': requestData.length
            },
            body: requestData
        });

        // Clean up the temporary file
        try {
            unlinkSync(tempFilePath);
        } catch (cleanupError) {
            console.error('Error cleaning up temp file:', cleanupError);
        }

        if (!response.ok) {
            const errorText = await response.text();
            console.error('PDF Extraction API Error:', errorText);
            throw new Error('Failed to extract text from PDF');
        }

        const result = await response.json();

        // Clean up the extracted text by removing [pdfRest Free Demo] placeholders
        const cleanText = (result?.fullText || '').replace(/\[pdfRest Free Demo\]/g, '').trim();

        res.json({
            success: true,
            fullText: cleanText,
        });

    } catch (error) {
        console.error('PDF Processing Error:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Error processing PDF'
        });
    }
};