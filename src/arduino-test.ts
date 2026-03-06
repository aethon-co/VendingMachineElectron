import { SerialPort } from 'serialport';

// Configuration
const BAUD_RATE = 9600; // Standard Arduino baud rate
const MESSAGES = ["row1", "row2"];
const INTERVAL_MS = 5000;

async function runTest() {
    console.log("Scanning for available serial ports...");
    const ports = await SerialPort.list();

    // Try to find the Arduino port. Often contains 'usb', 'arduino', or 'usbmodem' on Mac
    const arduinoPortInfo = ports.find(port =>
        port.manufacturer?.toLowerCase().includes('arduino') ||
        port.path.toLowerCase().includes('usbmodem') ||
        port.path.toLowerCase().includes('usbserial')
    );

    if (!arduinoPortInfo && ports.length > 0) {
        console.error("Could not automatically detect Arduino. Using the first available port.");
        console.log("Available ports:");
        console.table(ports);
    } else if (ports.length === 0) {
        console.error("No serial ports found. Please connect your Arduino!");
        return;
    }

    const targetPath = arduinoPortInfo ? arduinoPortInfo.path : ports[0].path;

    console.log(`Connecting to port: ${targetPath}`);

    // Open the serial port connection
    const port = new SerialPort({
        path: targetPath,
        baudRate: BAUD_RATE,
    });

    port.on('open', () => {
        console.log(`Port ${targetPath} opened successfully.`);
        console.log(`Queueing messages: ${JSON.stringify(MESSAGES)}`);

        // Give Arduino 2 seconds to reboot after serial connection opens (standard Arduino behavior)
        setTimeout(() => {
            let currentIndex = 0;

            const intervalId = setInterval(() => {
                if (currentIndex >= MESSAGES.length) {
                    console.log("\nFinished sending all messages.");
                    clearInterval(intervalId);

                    // Wait a bit before closing to capture any final responses
                    setTimeout(() => port.close(), 1000);
                    return;
                }

                const msg = MESSAGES[currentIndex];
                console.log(`[${new Date().toLocaleTimeString()}] Sending: ${msg}`);

                // Appending newline is usually best practice so Arduino can use Serial.readStringUntil('\n')
                port.write(`${msg}\n`, (err) => {
                    if (err) {
                        return console.log('Error on write: ', err.message);
                    }
                });

                currentIndex++;
            }, INTERVAL_MS);

        }, 2000);
    });

    port.on('error', (err) => {
        console.error(`SerialPort Error: ${err.message}`);
    });

    // Listen for data coming back from Arduino
    port.on('data', (data) => {
        console.log(`[Arduino]: ${data.toString().trim()}`);
    });
}

runTest();
