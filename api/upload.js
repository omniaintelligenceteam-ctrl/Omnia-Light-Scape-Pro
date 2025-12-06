import { handleUpload } from '@vercel/blob/client';

export const config = {
  runtime: 'nodejs',
};

export default async function handler(request) {
  const body = await request.json();

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        return {
          allowedContentTypes: ['image/jpeg', 'image/png'],
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        console.log('Upload finished:', blob.url);
      },
    });

    return new Response(JSON.stringify(jsonResponse));
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400 }
    );
  }
}
