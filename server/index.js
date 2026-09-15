import app from './app.js';
import { initDb } from './db.js';

const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log(`🚀 LuminaFinder backend running on http://localhost:${PORT}`);
  try {
    await initDb();
    console.log('✅ Database schema initialised.');
  } catch (err) {
    console.error('❌ Failed to initialise database:', err);
  }
});