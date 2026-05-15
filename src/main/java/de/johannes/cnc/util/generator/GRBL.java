package de.johannes.cnc.util.generator;

import de.johannes.cnc.util.CNCConsole;

public class GRBL {

    public enum SpindleMode {
        CONSTANT_POWER("M3"),
        DYNAMIC_POWER("M4");

        private final String value;
        SpindleMode(String value) {
            this.value = value;
        }

        public String value() {
            return value;
        }
    }

    public enum DistanceMode {
        ABSOLUTE("G90"),
        RELATIVE("G91");

        private final String value;

        DistanceMode(String value) {
            this.value = value;
        }

        public String value() {
            return value;
        }
    }

    public enum Units {
        IMPERIAL("G20"),
        METRIC("G21");

        private final String value;

        Units(String value) {
            this.value = value;
        }

        public String value() {
            return value;
        }
    }

    public enum Plane {
        XY("G17"),
        XZ("G18"),
        YZ("G19");

        private final String value;

        Plane(String value) {
            this.value = value;
        }

        public String value() {
            return value;
        }
    }

    public enum CoordinateSystem {
        G54,
        G55,
        G56,
        G57,
        G58, 
        G59
    }

    private final CNCConsole console;
    private SpindleMode spindleMode = SpindleMode.DYNAMIC_POWER;
    private int feedRate = 6000;
    private int power = 0;

    public int feedRate() {
        return feedRate;
    }

    public int power() {
        return power;
    }

    public SpindleMode spindleMode() {
        return spindleMode;
    }

    public GRBL(CNCConsole console) {
        this.console = console;
    }

    public void init(Units units, DistanceMode distanceMode, Plane plane) {
        setSpindleMode(SpindleMode.DYNAMIC_POWER);
        setUnits(units);
        setDistanceMode(distanceMode);
        setPlane(plane);
        laserOff();
        setPower(0);
    }

    public void setUnits(Units units) {
        console.sendLine(units.value());
    }

    public void setCoordinateSystem(CoordinateSystem cs) {
        console.sendLine(cs.name());
    }

    public void setDistanceMode(DistanceMode distanceMode) {
        console.sendLine(distanceMode.value());
    }

    public void setPlane(Plane plane) {
        console.sendLine(plane.value());
    }

    public void laserOff() {
        console.sendLine("M5");
    }

    public void setSpindleMode(SpindleMode mode) {
        this.spindleMode = mode;
        console.sendLine(mode.name() + " S" + this.power);
    }

    public void setPower(int power) {
        float value = Math.clamp(power, 0, 1000);
        console.sendLine(spindleMode.value()+ " S"+value);
    }

    public void setSpeed(int speed) {
        this.feedRate = speed;
    }

    public void moveTo(double x, double y) {
        console.sendLine("G0 X" + String.format("%.3f", x) + " Y" + String.format("%.3f", y));
    }

    public void moveTo(double x, double y, double z) {
        console.sendLine("G0 X" + String.format("%.3f", x) + " Y" + String.format("%.3f", y) + " Z" + String.format("%.3f", z));
    }

    public void lineTo(double x, double y) {
        console.sendLine("G1 X" + String.format("%.3f", x) + " Y" + String.format("%.3f", y) + " F" + this.feedRate);
    }

    public void lineTo(double x, double y, double z) {
        console.sendLine("G1 X" + String.format("%.3f", x) + " Y" + String.format("%.3f", y) + " Z" + String.format("%.3f", z) + " F" + this.feedRate);
    }

    /** Arc using I/J offsets from current position */
    public void arcTo(double x, double y, double i, double j, boolean clockwise) {
        String cmd = clockwise ? "G2" : "G3";
        console.sendLine(cmd + " X" + String.format("%.3f", x) + " Y" + String.format("%.3f", y) + " I" + String.format("%.3f", i) + " J" + String.format("%.3f", j) + " F" + this.feedRate);
    }

    public void arcTo(double x, double y, double radius, boolean clockwise) {
        String cmd = clockwise ? "G2" : "G3";
        console.sendLine(cmd + " X" + String.format("%.3f", x) + " Y" + String.format("%.3f", y) + " R" + String.format("%.3f", radius) + " F" + this.feedRate);
    }

    public void circle(double i, double j, boolean clockwise) {
        String cmd = clockwise ? "G2" : "G3";
        console.sendLine(cmd + " I" + String.format("%.3f", i) + " J" + String.format("%.3f", j) + " F" + this.feedRate);
    }

    public void movePath(double[]... points) {
        for (double[] point : points) {
            if (point.length == 2) lineTo(point[0], point[1]);
            else if (point.length == 3) lineTo(point[0], point[1], point[2]);
        }
    }

    public void probeToward(double x, double y, double z) {
        console.sendLine("G38.2 X" + String.format("%.3f", x) + " Y" + String.format("%.3f", y) + " Z" + String.format("%.3f", z) + " F" + this.feedRate);
    }

    public void probeSoft(double x, double y, double z) {
        console.sendLine("G38.3 X" + String.format("%.3f", x) + " Y" + String.format("%.3f", y) + " Z" + String.format("%.3f", z) + " F" + this.feedRate);
    }

    public void probeAway(double x, double y, double z) {
        console.sendLine("G38.4 X" + String.format("%.3f", x) + " Y" + String.format("%.3f", y) + " Z" + String.format("%.3f", z) + " F" + this.feedRate);
    }

    public void setOrigin() {
        console.sendLine("G92 X0 Y0 Z0");
    }

    public void setOrigin(double x, double y) {
        console.sendLine("G92 X" + String.format("%.3f", x) + " Y" + String.format("%.3f", y));
    }

    public void resetOrigin() {
        console.sendLine("G92.1");
    }

    public void setWorkOffset(int pIndex, double x, double y, double z) {
        console.sendLine("G10 L2 P" + pIndex + " X" + String.format("%.3f", x) + " Y" + String.format("%.3f", y) + " Z" + String.format("%.3f", z));
    }

    public void goToStoredPosition1() {
        console.sendLine("G28");
    }

    public void goToStoredPosition2() {
        console.sendLine("G30");
    }

    public void storePosition1() {
        console.sendLine("G28.1");
    }

    public void storePosition2() {
        console.sendLine("G30.1");
    }

    public void home() {
        console.sendLine("$H");
    }

    public void dwell(int milliseconds) {
        console.sendLine("G4 P" + milliseconds);
    }

    public void pause() {
        console.sendLine("M0");
    }

    public void optionalPause() {
        console.sendLine("M1");
    }

    public void coolantOn() {
        console.sendLine("M8");
    }

    public void coolantMist() {
        console.sendLine("M7");
    }

    public void coolantOff() {
        console.sendLine("M9");
    }

    public void end() {
        laserOff();
        moveTo(0, 0);
        console.sendLine("M2");
    }

    public void raw(String gcode) {
        console.sendLine(gcode);
    }

    public void printSettings() {
        console.sendLine("$$");
    }

    public void printParserState() {
        console.sendLine("$G");
    }

    public void printPosition() {
        console.sendLine("?");
    }

    public void unlock() {
        console.sendLine("$X");
    }

    public void reset() {
        console.sendLine("\u0018");
    }

}
