import { handleUpload } from '@vercel/blob/client';

export const config = {
  runtime: 'nodejs', // This is crucial
};

export default async function handler(request, response) {
  const body = await request.body;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        // Authenticate users here if needed in the future
        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/gif'],
          tokenPayload: JSON.stringify({
            // Optional payload
          }),
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log('Upload completed:', blob.url);
      },
    });

    response.status(200).json(jsonResponse);
  } catch (error) {
    console.error(error);
    response.status(400).json({ error: error.message });
  }
}
