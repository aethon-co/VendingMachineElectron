import { SerialPort } from 'serialport';

// Configuration
const BAUD_RATE = 9600; // Standard Arduino baud rate
const INTERVAL_MS = 5000;

let port: SerialPort | null = null;
let messageQueue: string[] = [];
let isDispensing = false;

export async function initSerial() {
    console.log("[SerialService] Scanning for available serial ports...");
    const ports = await SerialPort.list();

    const arduinoPortInfo = ports.find(port =>
        port.manufacturer?.toLowerCase().includes('arduino') ||
        port.path.toLowerCase().includes('usbmodem') ||
        port.path.toLowerCase().includes('usbserial')
    );

    if (!arduinoPortInfo && ports.length > 0) {
        console.error("[SerialService] Could not automatically detect Arduino. Ensure it is connected!");
        return;
    } else if (ports.length === 0) {
        console.error("[SerialService] No serial ports found. Please connect your Arduino!");
        return;
    }

    const targetPath = arduinoPortInfo ? arduinoPortInfo.path : ports[0].path;
    console.log(`[SerialService] Connecting to port: ${targetPath}`);

    port = new SerialPort({
        path: targetPath,
        baudRate: BAUD_RATE,
    });

    port.on('open', () => {
        console.log(`[SerialService] Port ${targetPath} opened successfully.`);
    });

    port.on('error', (err) => {
        console.error(`[SerialService] Error: ${err.message}`);
    });

    port.on('data', (data) => {
        console.log(`[Arduino]: ${data.toString().trim()}`);
    });
}

function processQueue() {
    if (isDispensing || messageQueue.length === 0) return;
    isDispensing = true;

    // Give Arduino a tiny buffer if needed, but since it's already open, we can start intervals
    const intervalId = setInterval(() => {
        if (messageQueue.length === 0) {
            console.log("[SerialService] Finished sending all requested items.");
            clearInterval(intervalId);
            isDispensing = false;
            return;
        }

        const msg = messageQueue.shift();
        if (msg) {
            console.log(`[${new Date().toLocaleTimeString()}] Sending to auto-dispenser: ${msg}`);

            // "For odd numbers, make the LED blink and even numbers to turn it off"
            const match = msg.match(/row(\d+)/);
            if (match) {
                const rowNum = parseInt(match[1]);
                if (rowNum % 2 !== 0) {
                    console.log(`[SerialService] Odd row detected - asking Arduino to BLINK LED`);
                    port?.write(`blink\n`);
                } else {
                    console.log(`[SerialService] Even row detected - asking Arduino to TURN OFF LED`);
                    port?.write(`off\n`);
                }
            }

            // Also send the actual row number so Arduino knows what to dispense
            setTimeout(() => {
                port?.write(`${msg}\n`, (err) => {
                    if (err) {
                        return console.log('[SerialService] Error on write: ', err.message);
                    }
                });
            }, 500); // Send the row selection half a second after the LED ping
        }
    }, INTERVAL_MS);
}

export function dispenseItems(items: string[]) {
    if (!port || !port.isOpen) {
        console.error("[SerialService] Cannot dispense! Port is not connected.");
        return;
    }

    console.log(`[SerialService] Queueing messages: ${JSON.stringify(items)}`);
    messageQueue.push(...items);
    processQueue();
}
