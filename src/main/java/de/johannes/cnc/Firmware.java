package de.johannes.cnc;

import com.fazecast.jSerialComm.SerialPort;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.util.regex.Pattern;

public enum Firmware {

    GRBL(115200, Pattern.compile("Grbl \\d")),
    MARLIN(250000, Pattern.compile("FIRMWARE_NAME:Marlin")),
    GRBL_HAL(115200, Pattern.compile("GrblHAL")),
    FLUID_NC(115200, Pattern.compile("FluidNC")),
    SMOOTHIE_WARE(115200, Pattern.compile("Smoothie")),
    REP_RAP_FIRMWARE(115200, Pattern.compile("FIRMWARE_NAME:RepRapFirmware"));

    private final int     baudRate;
    private final Pattern handshakePattern;

    Firmware(int baudRate, Pattern handshakePattern) {
        this.baudRate = baudRate;
        this.handshakePattern = handshakePattern;
    }

    public SerialPort bindPort(String portName) {
        return bindPort(portName, this.baudRate);
    }

    public static SerialPort bindPort(String portName, int baudRate) {
        SerialPort port = SerialPort.getCommPort(portName);
        port.setBaudRate(baudRate);
        port.setComPortTimeouts(SerialPort.TIMEOUT_READ_BLOCKING, 2000, 0);

        if(!port.openPort()) return null;

        try {
            port.clearDTR();
            Thread.sleep(200);
            port.setDTR();
            Thread.sleep(2000);
            byte[] buf = new byte[256];
            int read = port.readBytes(buf, buf.length);
            System.out.println("[grbl] Raw bytes read: " + read);
            System.out.println("[grbl] Raw: " + new String(buf, 0, Math.max(read, 0)));
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        return port;
    }

    public static SerialPort detectFirmware(String portName) {
        for (Firmware firmware : Firmware.values()) {
            SerialPort port = SerialPort.getCommPort(portName);
            port.setBaudRate(firmware.baudRate);
            port.setComPortTimeouts(SerialPort.TIMEOUT_READ_BLOCKING, 2000, 0);

            if (!port.openPort()) continue;

            try {
                Thread.sleep(2000);
                port.getOutputStream().write("\n".getBytes());
                BufferedReader reader = new BufferedReader(new InputStreamReader(port.getInputStream()));
                String response = reader.readLine();

                if (response != null && firmware.handshakePattern.matcher(response).find()) {
                    System.out.println("Detected: " + firmware + " at " + firmware.baudRate + " baud");
                    return port;
                } else {
                    port.closePort();
                }
            } catch (Exception e) {
                port.closePort();
            }
        }
        return null;
    }

}
