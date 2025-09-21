import { generateId } from "../services/idGenerator.js";
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

        // Create form data for the PDF extraction API
        const boundary = `----WebKitFormBoundary${Math.random().toString(16).substr(2)}`;
        const eol = '\r\n';
        let data = [];

        // Add file part
        data.push(Buffer.from(`--${boundary}${eol}`));
        data.push(Buffer.from(`Content-Disposition: form-data; name="file"; filename="upload.pdf"${eol}`));
        data.push(Buffer.from(`Content-Type: application/pdf${eol}${eol}`));
        data.push(buffer);
        data.push(Buffer.from(eol));

        // Add other form fields
        const fields = {
            full_text: 'document',
            preserve_line_breaks: 'off',
            word_style: 'off',
            word_coordinates: 'off',
            output_type: 'json'
        };

        for (const [key, value] of Object.entries(fields)) {
            data.push(Buffer.from(`--${boundary}${eol}`));
            data.push(Buffer.from(`Content-Disposition: form-data; name="${key}"${eol}${eol}`));
            data.push(Buffer.from(value));
            data.push(Buffer.from(eol));
        }

        data.push(Buffer.from(`--${boundary}--${eol}`));

        const formData = Buffer.concat(data);

        // Make request to PDF extraction API
        const response = await fetchWithNative('https://api.pdflayer.com/api/extract', {
            method: 'POST',
            headers: {
                'Content-Type': `multipart/form-data; boundary=${boundary}`,
                'Authorization': `Bearer ${PDF_EXTRACT_KEY}`
            },
            body: formData
        });

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