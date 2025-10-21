export default function TestPage() {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>🚀 Railway Test Page</h1>
      <p>If you can see this, Railway is working!</p>
      <p>Time: {new Date().toISOString()}</p>
    </div>
  );
}
