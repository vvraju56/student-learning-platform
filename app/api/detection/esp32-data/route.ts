export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { uid, postureX, postureY, postureZ, roll, pitch, yaw } = body;

    if (!uid) {
      return Response.json({ error: 'Missing uid' }, { status: 400 });
    }

    const sensorData = {
      uid,
      timestamp: new Date().toISOString(),
      postureX,
      postureY,
      postureZ,
      roll,
      pitch,
      yaw,
    };

    // In preview, store to localStorage
    const existingData = JSON.parse(localStorage.getItem('esp32Data') || '[]');
    existingData.push(sensorData);
    localStorage.setItem('esp32Data', JSON.stringify(existingData.slice(-100)));

    return Response.json({ success: true, data: sensorData });
  } catch (error) {
    console.error(' ESP32 data error:', error);
    return Response.json({ error: 'Failed to process ESP32 data' }, { status: 500 });
  }
}
