import { SerialPort } from 'serialport';

// Configuration
const BAUD_RATE = 9600; // Standard Arduino baud rate
const INTERVAL_MS = 7000;

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

    const intervalId = setInterval(() => {
        if (messageQueue.length === 0) {
            console.log("[SerialService] Finished sending all items.");
            clearInterval(intervalId);
            isDispensing = false;
            return;
        }

        const letterCmd = messageQueue.shift()!;
        console.log(`[SerialService] Sending letter command: ${letterCmd}`);
        port?.write(`${letterCmd}\n`, (err) => {
            if (err) {
                console.error('[SerialService] Error on write:', err.message);
            }
        });
    }, INTERVAL_MS);
}

/**
 * Accepts an array of letter commands (e.g. ["E", "E", "C"]) and queues
 * them to be sent to the Arduino sequentially.
 */
export function dispenseItems(items: string[]) {
    if (!port || !port.isOpen) {
        console.error("[SerialService] Cannot dispense! Port is not connected.");
        return;
    }

    console.log(`[SerialService] Queueing commands: ${JSON.stringify(items)}`);
    messageQueue.push(...items);
    processQueue();
}

