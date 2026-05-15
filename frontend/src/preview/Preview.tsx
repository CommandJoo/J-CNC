import "./Preview.css"
import {useCallback, useEffect, useRef, useState} from "react";
import {useGRBL} from "../GRBLContext.tsx";

const WORLD_LIMIT = 1000;

export default function Preview() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const offset = useRef({x: 0, y: 0});
    const scale = useRef(1);
    const isPanning = useRef(false);
    const lastMouse = useRef({x: 0, y: 0});
    const [cursorPos, setCursorPos] = useState<{ x: number, y: number } | null>(null);

    const grbl = useGRBL();

    const getCSSVar = (el: HTMLElement, name: string) =>
        getComputedStyle(el).getPropertyValue(name).trim();

    const getStepSize = (s: number): number => {
        const rawStep = 100 / s;
        const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
        const normalized = rawStep / magnitude;
        let step: number;
        if (normalized < 2) step = magnitude;
        else if (normalized < 5) step = magnitude * 2;
        else step = magnitude * 5;
        return Math.max(1, step);
    };

    const formatLabel = (worldValue: number, step: number): string => {
        const rounded = Math.round(worldValue);
        if (step >= 10) return `${rounded / 10}`;
        return `${rounded}`;
    };

    const clampOffset = (width: number, height: number) => {
        const s = scale.current;
        const minX = width / 2 - WORLD_LIMIT * s;
        const maxX = width / 2 + WORLD_LIMIT * s;
        const minY = height / 2 - WORLD_LIMIT * s;
        const maxY = height / 2 + WORLD_LIMIT * s;
        offset.current.x = Math.min(maxX, Math.max(minX, offset.current.x));
        offset.current.y = Math.min(maxY, Math.max(minY, offset.current.y));
    };

    const drawRulers = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
        if(!canvasRef.current) return;
        const s = scale.current;
        const ox = offset.current.x;
        const oy = offset.current.y;
        const step = getStepSize(s);

        // X: unchanged
        const worldLeft = -ox / s;
        const worldRight = (width - ox) / s;

        // Y: flipped — top of screen is positive, bottom is negative
        const worldTop = oy / s;
        const worldBottom = (oy - height) / s;

        const firstX = Math.ceil(worldLeft / step) * step;
        const firstY = Math.floor(worldTop / step) * step; // start high, count down

        const PAD = 4;
        const EPSILON = step * 0.01;

        ctx.save();
        ctx.font = "10px monospace";

        const colorRuler = getCSSVar(canvasRef.current, "--ruler-color");
        const colorNumbers = getCSSVar(canvasRef.current, "--number-color");
        const colorUnit = getCSSVar(canvasRef.current, "--unit-color");
        const colorRed = getCSSVar(canvasRef.current, "--red");
        const colorBlue = getCSSVar(canvasRef.current, "--blue");

        // vertical grid lines + top/bottom labels (X axis — unchanged)
        for (let wx = firstX; wx <= worldRight; wx += step) {
            const sx = wx * s + ox;
            const isOrigin = Math.abs(wx) < EPSILON;
            const label = isOrigin ? "0" : formatLabel(wx, step);

            ctx.beginPath();
            ctx.strokeStyle = isOrigin ? colorRed : colorRuler;
            ctx.lineWidth = isOrigin ? 2 : 1;
            ctx.moveTo(sx, 0);
            ctx.lineTo(sx, height);
            ctx.stroke();

            ctx.fillStyle = isOrigin ? colorRed : colorNumbers;
            ctx.textBaseline = "top";
            ctx.textAlign = "left";
            ctx.fillText(label, sx + PAD, PAD);
            ctx.textBaseline = "bottom";
            ctx.fillText(label, sx + PAD, height - PAD);
        }

        for (let wy = firstY; wy >= worldBottom; wy -= step) {
            const sy = oy - wy * s; // flipped: subtract instead of add
            const isOrigin = Math.abs(wy) < EPSILON;
            const label = isOrigin ? "0" : formatLabel(wy, step);

            ctx.beginPath();
            ctx.strokeStyle = isOrigin ? colorBlue : colorRuler;
            ctx.lineWidth = isOrigin ? 2 : 1;
            ctx.moveTo(0, sy);
            ctx.lineTo(width, sy);
            ctx.stroke();

            ctx.fillStyle = isOrigin ? colorBlue : colorNumbers;
            ctx.textBaseline = "middle";
            ctx.textAlign = "left";
            ctx.fillText(label, PAD, sy);
            ctx.textAlign = "right";
            ctx.fillText(label, width - PAD, sy);
        }

        ctx.textAlign = "left";
        ctx.textBaseline = "bottom";
        ctx.font = "14px monospace";
        ctx.fillStyle = colorUnit;
        ctx.fillText(`${step >= 10 ? "cm" : "mm"}`, PAD, height - PAD);

        ctx.restore();
    }, []);

    const draw = useCallback((ctx: CanvasRenderingContext2D) => {
        ctx.lineWidth = 1 / scale.current;

        let cx = 0, cy = 0;

        ctx.beginPath();
        ctx.strokeStyle = "rgba(150,150,150,0.4)";

        grbl.lines.forEach((line) => {
            const cmd = line.trim().split(/\s+/);
            const code = cmd[0].toUpperCase();

            if (code === "G0" || code === "G1") {
                let x = cx, y = cy;
                for (let i = 1; i < cmd.length; i++) {
                    const seg = cmd[i].toUpperCase();
                    if (seg.startsWith("X")) x = Number(seg.slice(1));
                    else if (seg.startsWith("Y")) y = Number(seg.slice(1));
                }

                if (code === "G0") {
                    ctx.moveTo(cx, cy);
                    ctx.lineTo(x, y);
                }

                cx = x;
                cy = y;
            }
        });
        ctx.stroke();

        cx = 0; cy = 0;

        ctx.beginPath();
        ctx.strokeStyle = "#F00";

        grbl.lines.forEach((line) => {
            const cmd = line.trim().split(/\s+/);
            const code = cmd[0].toUpperCase();

            if (code === "G0" || code === "G1") {
                let x = cx, y = cy;
                for (let i = 1; i < cmd.length; i++) {
                    const seg = cmd[i].toUpperCase();
                    if (seg.startsWith("X")) x = Number(seg.slice(1));
                    else if (seg.startsWith("Y")) y = Number(seg.slice(1));
                }

                if (code === "G0") ctx.moveTo(x, y); // lift pen on rapid
                else { ctx.moveTo(cx, cy); ctx.lineTo(x, y); }

                cx = x;
                cy = y;
            }
        });
        ctx.stroke();

    }, [grbl, scale]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let width = 0;
        let height = 0;
        let dpr = 1;
        let minScale = 1;
        const MAX_SCALE = 200;

        const redraw = () => {
            // Clear in real pixel space
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw in CSS pixel space
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

            ctx.save();
            ctx.translate(offset.current.x, offset.current.y);
            ctx.scale(scale.current, -scale.current);
            draw(ctx);
            ctx.restore();

            drawRulers(ctx, width, height);
        };

        const resizeCanvas = () => {
            const rect = canvas.getBoundingClientRect();

            const oldWidth = width;
            const oldHeight = height;

            width = rect.width;
            height = rect.height;
            dpr = window.devicePixelRatio || 1;
            minScale = Math.min(width, height) / (WORLD_LIMIT * 2);

            canvas.width = Math.round(width * dpr);
            canvas.height = Math.round(height * dpr);

            if (oldWidth === 0 || oldHeight === 0) {
                offset.current = {x: width / 2, y: height / 2};
            } else {
                offset.current.x += (width - oldWidth) / 2;
                offset.current.y += (height - oldHeight) / 2;
            }

            scale.current = Math.max(minScale, scale.current);
            clampOffset(width, height);

            redraw();
        };

        const onMouseDown = (e: MouseEvent) => {
            isPanning.current = true;
            lastMouse.current = {x: e.clientX, y: e.clientY};
        };

        const onMouseMove = (e: MouseEvent) => {
            const rect = canvas.getBoundingClientRect();
            const screenX = e.clientX - rect.left;
            const screenY = e.clientY - rect.top;

            setCursorPos({
                x: (screenX - offset.current.x) / scale.current,
                y: -(screenY - offset.current.y) / scale.current,
            });

            if (!isPanning.current) return;

            offset.current.x += e.clientX - lastMouse.current.x;
            offset.current.y += e.clientY - lastMouse.current.y;

            lastMouse.current = {x: e.clientX, y: e.clientY};

            clampOffset(width, height);
            redraw();
        };

        const onMouseUp = () => {
            isPanning.current = false;
        };

        const onMouseLeave = () => {
            isPanning.current = false;
            setCursorPos(null);
        };

        const onWheel = (e: WheelEvent) => {
            e.preventDefault();

            const zoomFactor = 1 - e.deltaY * 0.0003;

            const rect = canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            const newScale = Math.min(
                MAX_SCALE,
                Math.max(minScale, scale.current * zoomFactor)
            );

            const actualFactor = newScale / scale.current;
            scale.current = newScale;

            offset.current.x = mouseX - (mouseX - offset.current.x) * actualFactor;
            offset.current.y = mouseY - (mouseY - offset.current.y) * actualFactor;

            clampOffset(width, height);
            redraw();
        };

        const resizeObserver = new ResizeObserver(resizeCanvas);
        resizeObserver.observe(canvas);

        canvas.addEventListener("mousedown", onMouseDown);
        canvas.addEventListener("mousemove", onMouseMove);
        canvas.addEventListener("mouseup", onMouseUp);
        canvas.addEventListener("mouseleave", onMouseLeave);
        canvas.addEventListener("wheel", onWheel, {passive: false});

        resizeCanvas();

        return () => {
            resizeObserver.disconnect();

            canvas.removeEventListener("mousedown", onMouseDown);
            canvas.removeEventListener("mousemove", onMouseMove);
            canvas.removeEventListener("mouseup", onMouseUp);
            canvas.removeEventListener("mouseleave", onMouseLeave);
            canvas.removeEventListener("wheel", onWheel);
        };
    }, [draw, drawRulers]);

    return <div id={"preview"} style={{position: "relative"}}>
        <canvas ref={canvasRef} id={"canvas"}/>
        {cursorPos && <div id={"info"}>
            <div></div>
            <div>{"X     "}</div>
            <div>{"Y     "}</div>
            <div className={"first"}>Cursor</div>
            <div>{`${(cursorPos.x/10).toFixed(2)}cm`}</div>
            <div>{`${(cursorPos.y/10).toFixed(2)}cm`}</div>
        </div>}
    </div>
}