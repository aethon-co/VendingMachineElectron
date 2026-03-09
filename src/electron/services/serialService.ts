import { SerialPort } from 'serialport';

const BAUD_RATE = 9600;
const INTERVAL_MS = 7000;

let port: SerialPort | null = null;
let currentResolve: (() => void) | null = null;

function processQueue() {
    if (isDispensing || messageQueue.length === 0) {
        if (messageQueue.length === 0 && currentResolve) {
            currentResolve();
            currentResolve = null;
        }
        return;
    }
    isDispensing = true;

    const intervalId = setInterval(() => {
        if (messageQueue.length === 0) {
            console.log("[SerialService] Finished sending all items.");
            clearInterval(intervalId);
            isDispensing = false;
            if (currentResolve) {
                currentResolve();
                currentResolve = null;
            }
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
 * them to be sent to the Arduino sequentially. Returns a promise that
 * resolves when all items are dispensed.
 */
export function dispenseItems(items: string[]): Promise<void> {
    return new Promise((resolve) => {
        if (!port || !port.isOpen) {
            console.error("[SerialService] Cannot dispense! Port is not connected.");
            resolve();
            return;
        }

        console.log(`[SerialService] Queueing commands: ${JSON.stringify(items)}`);
        messageQueue.push(...items);
        currentResolve = resolve;
        processQueue();
    });
}

