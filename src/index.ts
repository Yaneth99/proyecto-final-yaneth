import { Obj3D } from './Obj3D.js';
import { CvZbuf } from './CvZbuf.js';
import { butacaBase as pinzaBaseData, butacaBrazo as pinzaMovilData } from './butacaModels.js';

let canvas: HTMLCanvasElement;
let graphics: CanvasRenderingContext2D;

canvas = <HTMLCanvasElement>document.getElementById('circlechart');
graphics = canvas.getContext('2d');

let cv: CvZbuf;
let obj: Obj3D;

let baseObj: Obj3D | null = null;
let movilObj: Obj3D | null = null;

function repaintAll() {
  if (!cv) cv = new CvZbuf(graphics, canvas);
  cv = new CvZbuf(graphics, canvas);
  
  if (baseObj) cv.addObj(baseObj);
  if (movilObj) cv.addObj(movilObj);
  
  if (baseObj) obj = baseObj;
  else if (movilObj) obj = movilObj;
  
  let totalVerts = 0;
  let totalTris = 0;
  
  if (baseObj) {
    totalVerts += baseObj.w.length - 1;
    totalTris += baseObj.getPolyList().length;
  }
  if (movilObj) {
    totalVerts += movilObj.w.length - 1;
    totalTris += movilObj.getPolyList().length;
  }
  
  const vEl = document.getElementById('stat-verts');
  if (vEl) vEl.innerText = totalVerts.toString();
  const tEl = document.getElementById('stat-tris');
  if (tEl) tEl.innerText = totalTris.toString();
  
  cv.paint();
}

function leerArchivoBase(e:any) {
  var archivo = e.target.files[0];
  if (!archivo) return;
  document.getElementById('file-name-base').innerText = archivo.name;
  var lector = new FileReader();
  lector.onload = function(ev) {
    var contenido = ev.target.result as string;
    const rawEl = document.getElementById('raw-base') as HTMLTextAreaElement;
    if (rawEl) rawEl.value = contenido;
    
    let tempObj = new Obj3D();
    if (tempObj.read(contenido)) {
      tempObj.baseColorR = 190; tempObj.baseColorG = 190; tempObj.baseColorB = 190;
      baseObj = tempObj;
      repaintAll();
    }
  };
  lector.readAsText(archivo);
}

function leerArchivoMovil(e:any) {
  var archivo = e.target.files[0];
  if (!archivo) return;
  document.getElementById('file-name-movil').innerText = archivo.name;
  var lector = new FileReader();
  lector.onload = function(ev) {
    var contenido = ev.target.result as string;
    const rawEl = document.getElementById('raw-movil') as HTMLTextAreaElement;
    if (rawEl) rawEl.value = contenido;
    
    let tempObj = new Obj3D();
    if (tempObj.read(contenido)) {
      tempObj.baseColorR = 190; tempObj.baseColorG = 190; tempObj.baseColorB = 190;
      tempObj.pivotX = 0; tempObj.pivotY = 0; tempObj.pivotZ = 0;
      movilObj = tempObj;
      repaintAll();
    }
  };
  lector.readAsText(archivo);
}

function vp(dTheta:number, dPhi:number, fRho:number):void{
  if (cv && cv.getObjs().length > 0) {
    cv.getObjs().forEach(o => o.vp(cv, dTheta, dPhi, fRho));
  }
}

// Eventos
document.getElementById('file-input-base')?.addEventListener('change', leerArchivoBase, false);
document.getElementById('file-input-movil')?.addEventListener('change', leerArchivoMovil, false);



let Pix: number, Piy: number;
let Pfx: number, Pfy: number;
let flag: boolean = false;

// Manipulación 360 (Ratón)
function handleMouse(evento: any) {
  Pix = evento.offsetX;
  Piy = evento.offsetY;
  flag = true;
}

function makeVizualization(evento: any) {
  if (flag && obj) {
    Pfx = evento.offsetX;
    Pfy = evento.offsetY;
    let difX = Pfx - Pix;
    let difY = Pfy - Piy;
    
    // Rota la silla en su eje (Y)
    if (baseObj) baseObj.globalRotY += difX * 0.01;
    if (movilObj) movilObj.globalRotY += difX * 0.01;
    
    // Mueve la paleta hacia arriba/abajo
    if (movilObj) {
       let ang = movilObj.localRotZ - difY * 0.02;
       if (ang > 0) ang = 0;
       if (ang < -Math.PI/2) ang = -Math.PI/2;
       movilObj.localRotZ = ang;
       
       const apSlider = <HTMLInputElement>document.getElementById('input-apertura');
       if (apSlider) {
         let deg = Math.round((-ang * 180) / Math.PI);
         apSlider.value = deg.toString();
         const valApertura = document.getElementById('val-apertura');
         if (valApertura) valApertura.innerText = deg + '°';
       }
    }
    
    cv.paint();
    Pix = Pfx;
    Piy = Pfy;
  }
}

function noDraw() {
  flag = false;
}

canvas.addEventListener('mousedown', handleMouse);
canvas.addEventListener('mouseup', noDraw);
canvas.addEventListener('mousemove', makeVizualization);
canvas.addEventListener('mouseleave', noDraw);


// Resize handling básico
function resizeCanvas() {
  const container = document.getElementById('canvas-container');
  if (container) {
    canvas.width = container.clientWidth;
    canvas.height = container.clientHeight;
    if (obj && cv) {
      cv.paint();
    }
  }
}

window.addEventListener('resize', resizeCanvas);
setTimeout(resizeCanvas, 100);

// D-Pad Rotation Handling
let manualRotationInterval: number;

function startManualRotation(dTheta: number, dPhi: number, fRho: number = 1) {
  if (!obj) return;
  
  const applyRotation = () => {
    if (dTheta !== 0) {
       if (baseObj) baseObj.globalRotY += dTheta;
       if (movilObj) movilObj.globalRotY += dTheta;
    }
    if (fRho !== 1) {
       vp(0, 0, fRho);
    }
    if (dPhi !== 0 && movilObj) {
        let ang = movilObj.localRotZ - dPhi * 0.5;
        if (ang > 0) ang = 0;
        if (ang < -Math.PI/2) ang = -Math.PI/2;
        movilObj.localRotZ = ang;
        
        const apSlider = <HTMLInputElement>document.getElementById('input-apertura');
        if (apSlider) {
          let deg = Math.round((-ang * 180) / Math.PI);
          apSlider.value = deg.toString();
          const valApertura = document.getElementById('val-apertura');
          if (valApertura) valApertura.innerText = deg + '°';
        }
        cv.paint();
    }
  };

  applyRotation();
  clearInterval(manualRotationInterval);
  manualRotationInterval = window.setInterval(applyRotation, 30);
}

function stopManualRotation() {
  clearInterval(manualRotationInterval);
}

function setupDPad() {
  const btnUp = document.getElementById('btn-rot-up');
  const btnDown = document.getElementById('btn-rot-down');
  const btnLeft = document.getElementById('btn-rot-left');
  const btnRight = document.getElementById('btn-rot-right');
  const btnZoomIn = document.getElementById('btn-zoom-in');
  const btnZoomOut = document.getElementById('btn-zoom-out');

  const addHoldEvents = (btn: HTMLElement, dTheta: number, dPhi: number, fRho: number = 1) => {
    if (!btn) return;
    btn.addEventListener('mousedown', () => startManualRotation(dTheta, dPhi, fRho));
    btn.addEventListener('mouseup', stopManualRotation);
    btn.addEventListener('mouseleave', stopManualRotation);
    
    // Touch support for mobile
    btn.addEventListener('touchstart', (e) => { e.preventDefault(); startManualRotation(dTheta, dPhi, fRho); });
    btn.addEventListener('touchend', (e) => { e.preventDefault(); stopManualRotation(); });
    btn.addEventListener('touchcancel', (e) => { e.preventDefault(); stopManualRotation(); });
  };

  const rotSpeed = 0.05; // Base rotation speed for D-pad
  addHoldEvents(btnUp, 0, rotSpeed);
  addHoldEvents(btnDown, 0, -rotSpeed);
  addHoldEvents(btnLeft, -rotSpeed, 0);
  addHoldEvents(btnRight, rotSpeed, 0);
  
  // Zoom functionality for buttons (continuous)
  addHoldEvents(btnZoomIn, 0, 0, 0.95);
  addHoldEvents(btnZoomOut, 0, 0, 1.05);
}
setupDPad();

// Mouse wheel zoom
canvas.addEventListener('wheel', (e) => {
  e.preventDefault(); // Stop page from scrolling
  if (!obj) return;
  if (e.deltaY < 0) {
    vp(0, 0, 0.9); // Zoom in
  } else {
    vp(0, 0, 1.1); // Zoom out
  }
});

// Cargar pinza por defecto al iniciar
window.addEventListener('load', () => {
  cv = new CvZbuf(graphics, canvas);
  
  if (pinzaBaseData) {
    let tempObj = new Obj3D();
    if (tempObj.read(pinzaBaseData)) {
        tempObj.baseColorR = 190; tempObj.baseColorG = 190; tempObj.baseColorB = 190;
        tempObj.targetY = 1.5; // Centramos la figura verticalmente
        tempObj.theta = -Math.PI / 2;
        tempObj.phi = 0.1;
        tempObj.globalRotY = -Math.PI / 6;
        tempObj.rho = 5 * tempObj.rhoMin; // Más de lejos
        baseObj = tempObj;
        const rawEl = document.getElementById('raw-base') as HTMLTextAreaElement;
        if (rawEl) rawEl.value = pinzaBaseData;
        const nameEl = document.getElementById('file-name-base');
        if (nameEl) nameEl.innerText = 'balon.txt';
      }
    }
    
    if (pinzaMovilData) {
      let tempObj = new Obj3D();
      if (tempObj.read(pinzaMovilData)) {
        tempObj.baseColorR = 190; tempObj.baseColorG = 190; tempObj.baseColorB = 190;
        tempObj.pivotX = 0; tempObj.pivotY = 0; tempObj.pivotZ = 0;
        tempObj.targetX = -2.0; tempObj.targetY = -0.5; tempObj.targetZ = 0; // Se ensambla perfecto en 2.0, 2.0
        tempObj.theta = -Math.PI / 2;
        tempObj.phi = 0.1;
        tempObj.globalRotY = -Math.PI / 6;
        if (baseObj) tempObj.rho = baseObj.rho; // Misma escala de perspectiva!
        movilObj = tempObj;
        const rawEl = document.getElementById('raw-movil') as HTMLTextAreaElement;
        if (rawEl) rawEl.value = pinzaMovilData;
        const nameEl = document.getElementById('file-name-movil');
        if (nameEl) nameEl.innerText = '< VACÍO >';
      }
    }
    
    repaintAll();
    
    // Color Palette Listeners
    document.getElementById('color-pink')?.addEventListener('click', () => {
      if (baseObj) { baseObj.baseColorR = 255; baseObj.baseColorG = 0; baseObj.baseColorB = 255; }
      repaintAll();
    });
    document.getElementById('color-blue')?.addEventListener('click', () => {
      if (baseObj) { baseObj.baseColorR = 0; baseObj.baseColorG = 255; baseObj.baseColorB = 255; }
      repaintAll();
    });
    document.getElementById('color-green')?.addEventListener('click', () => {
      if (baseObj) { baseObj.baseColorR = 57; baseObj.baseColorG = 255; baseObj.baseColorB = 20; }
      repaintAll();
    });
    
    // Lighting Sliders Listeners
    const lightDirX = document.getElementById('light-dir-x') as HTMLInputElement;
    const valLightDirX = document.getElementById('val-light-dir-x');
    lightDirX?.addEventListener('input', (e) => {
      let val = parseFloat((e.target as HTMLInputElement).value);
      if (valLightDirX) valLightDirX.innerText = val.toFixed(1);
      if (baseObj) baseObj.sunX = val;
      repaintAll();
    });
    
    const lightBright = document.getElementById('light-bright') as HTMLInputElement;
    const valLightBright = document.getElementById('val-light-bright');
    lightBright?.addEventListener('input', (e) => {
      let val = parseFloat((e.target as HTMLInputElement).value);
      if (valLightBright) valLightBright.innerText = val.toFixed(1);
      if (baseObj) baseObj.lightBright = val * 50; // amplify effect
      repaintAll();
    });
    
    const lightShadow = document.getElementById('light-shadow') as HTMLInputElement;
    const valLightShadow = document.getElementById('val-light-shadow');
    lightShadow?.addEventListener('input', (e) => {
      let val = parseFloat((e.target as HTMLInputElement).value);
      if (valLightShadow) valLightShadow.innerText = val.toFixed(1);
      if (baseObj) baseObj.lightShadow = val;
      repaintAll();
    });
});