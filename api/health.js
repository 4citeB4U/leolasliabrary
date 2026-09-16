export default function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  response.status(200).json({
    ok: true,
    product: "Leola's Library",
    runtime: 'vercel-node',
    version: '2.0.0-foundation'
  });
}
