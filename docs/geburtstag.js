'use strict';

function removeInstant() {
    for (let e of document.getElementsByClassName('instant-remove')) e.remove();
}
removeInstant();

for (let e of document.getElementsByClassName('instant-show')) e.style.display = 'inherit';

const anmelden_p = document.getElementById('anmelden-p');

const PGAME_MULT = .68;
const PROGRESS_BAR_CLICK_COUNT = 24;

const TIME_START = Date.now();

const ACHIVEMENTS = {
    'speedrunner': {
        'name': 'Speedrunner',
        'description': 'Make it in under 1 minute',
    },
    'ungeduldig': {
        'name': 'Ungeduldig',
        'description': 'Smash that anmelden button\nwhile waiting for the progress bar',
    },
    'rustacean': {
        'name': 'True Rustacean',
        'description': 'Make the only reasonable\ndecision',
    },
    'privacy-protector': {
        'name': 'Privacy Protector',
        'description': 'Select "Geht dich nix an"',
    },
};

let step = 'intro';
let gehtDichNixAnCounter = 0;
let progressBarPassed = false, kitpchaPassed = false;
let anmeldenTransform = [0, 0], anmeldenPinned = false;
let dragCoords = [0, 0];
let progressBarClickCount = 0;

let kitpchaSelection = 0;
let kitpchaIndex = 0;
const kitpchas = [
    {
        img: '/images/kitpcha/place-kit.png',
        pixelated: true,
        solution: 0x0077,
        prompt: 'Markiere alle Bilder mit Exzellenz.'
    },
    {
        img: '/images/kitpcha/ilias.png',
        pixelated: false,
        solution: 0x5000,
        prompt: 'Tritt dem ILIAS-Kurs bei.'
    },
    {
        img: '/images/kitpcha/koennen-sie-bitte-gucken.svg',
        pixelated: false,
        solution: 0x0080,
        prompt: 'Aber ist es Okay?'
    }
];

function enableStep(nr, fade=true) {
    for (let e of document.getElementsByTagName('input'))
        if (e.getAttribute('type') != 'submit') e.setAttribute('disabled', '');
    for (let e of document.getElementsByTagName('select')) e.setAttribute('disabled', '');
    step = nr;
    const name = 'step-' + nr;
    let clone = document.getElementById(name).content.cloneNode(true);
    if (fade)
        clone.children[0].classList.add('fade-in');
    anmelden_p.parentElement.insertBefore(clone, anmelden_p);
}

function submitPressed() {
    switch (step) {
        case 'intro':
            enableStep('erinner-checkbox');
            break;
        case 'erinner-checkbox':
            enableStep('noch-ein-paar-daten');
            document.getElementById('geschlecht').addEventListener('input', geschlechtChanged);
            break;
        case 'noch-ein-paar-daten':
            let e = document.getElementById('geschlecht');
            if (e.value === '?') {
                if (!gehtDichNixAnCounter++) {
                    let c = document.createElement('span');
                    c.textContent = 'Doch!';
                    c.style.color = 'red';
                    c.style.fontWeight = 'bolder';
                    c.classList.add('instant-remove');
                    e.parentElement.insertAdjacentElement('beforeend', c);
                    setAchivement('privacy-protector');
                }
                break;
            }
            gehtDichNixAnCounter = 0;
            removeInstant();
            enableStep('wie-viele-semester');
            document.getElementById('semester').addEventListener('input', semesterChanged);
            break;
        case 'wie-viele-semester':
            enableStep('progress-bar');
            progressBarGame(PGAME_MULT);
            break;
        case 'progress-bar':
            if (!progressBarPassed) {
                if (progressBarClickCount++ > PROGRESS_BAR_CLICK_COUNT) {
                    setAchivement('ungeduldig');
                    progressBarPassed = true;
                } else break;
            }
            enableStep('programmiersprache');
            document.getElementById('programmiersprache').addEventListener('input', programmierspracheChanged);
            break;
        case 'programmiersprache':
            if (document.getElementById('programmiersprache').value === 'rust')
                setAchivement('rustacean');
            enableStep('lila-pause');
            document.getElementById('lila-pause').addEventListener('input', lilaPauseChanged);
            break;
        case 'lila-pause':
            enableStep('kitpcha');
            changeKitpcha(0);
            document.getElementsByClassName('kitpcha-checkbox')[0].addEventListener('click', kitpchaClicked);
            let n = 0;
            for (let e of document.querySelectorAll('.kitpcha-q-matrix > div'))
                e.addEventListener('click', kitpchaBoxClicked(n++));
            for (let e of document.getElementsByClassName('kitpcha-q-submit'))
                e.addEventListener('click', kitpchaSubmit);
            break;
        case 'kitpcha':
            if (!kitpchaPassed) break;
            enableStep('name-vorname-1');
            break;
        case 'name-vorname-1':
            enableStep('name-vorname-2');
            break;
        case 'name-vorname-2':
            enableStep('flee');
            let anmeldenButton = document.getElementById('anmelden-button');
            window.addEventListener('mousemove', e => fleeMouseMove(anmeldenButton, e));
            break;
        case 'flee':
            if (!anmeldenPinned) break;
            enableStep('download');
            enablePdfLink();
            document.getElementById('anmelden-button').hidden = true;
            break;
        default:
            throw new Error('oh oh, this is not supposed to happen, oh no!');
    }
}

function fleeMouseMove(button, ev) {
    if (anmeldenPinned) return;
    if (!document.getElementById('no-robot').checked) return;
    const [x, y] = [ev.clientX, ev.clientY];
    const r = button.getClientRects()[0];
    const [cx, cy] = [r.left + r.width * .5, r.top + r.height * .5];
    const [dx, dy] = [x - cx, y - cy];
    const a = dx * dx + dy * dy;
    const g = Math.min(r.width, r.height) * 2.2;
    if (a < g * g) {
        const ln = Math.sqrt(a);
        let [nx, ny] = [dx / ln, dy / ln];
        nx *= g - ln;
        ny *= g - ln;
        anmeldenTransform[0] -= nx;
        anmeldenTransform[1] -= ny;
        const [clw, clh] = [document.documentElement.clientWidth, document.documentElement.clientHeight];
        if (cx <= nx || cy <= ny || cx >= clw || cy >= clh) {
            anmeldenTransform = [0, 0];
            button.style.transform = 'none';
        }
        button.style.transform = 'translate(' + anmeldenTransform[0] + 'px, ' + anmeldenTransform[1] + 'px)';
    }
}
function pinDown(ev) {
    ev.dataTransfer.dropEffect = 'move';
    ev.dataTransfer.clearData();
    ev.dataTransfer.setData('application/json', JSON.stringify([ev.clientX, ev.clientY]));
}
function pinUp(ev) {
    let dragStart;
    try {
        dragStart = JSON.parse(ev.dataTransfer.getData('application/json'));
    } catch (err) {
        if (!(err instanceof SyntaxError)) throw err;
    }
    if (!(dragStart instanceof Array)
        || dragStart.length !== 2
        || isNaN(dragStart[0])
        || isNaN(dragStart[1])) return;
    const [x, y] = [ev.clientX - dragStart[0], ev.clientY - dragStart[1]];
    dragCoords[0] += x;
    dragCoords[1] += y;
    ev.currentTarget.style.transform = 'translate(' + dragCoords[0] + 'px, ' + dragCoords[1] + 'px)';
    if (step === 'flee') {
        const r = document.getElementById('anmelden-button').getClientRects()[0];
        const [x, y] = [ev.clientX, ev.clientY];
        anmeldenPinned = (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom);
    }
    dragStart = null;
}
function geschlechtChanged(ev) { if (step === 'noch-ein-paar-daten') submitPressed(); }
function semesterChanged(ev) { if (step === 'wie-viele-semester') submitPressed(); }
function programmierspracheChanged(ev) { if (step === 'programmiersprache') submitPressed(); }
function lilaPauseChanged(ev) { if (step === 'lila-pause') submitPressed(); }
function kitpchaClicked(ev) {
    if (step !== 'kitpcha') return;
    let checkbox = document.getElementsByClassName('kitpcha-checkbox')[0];
    let circle = document.getElementsByClassName('kitpcha-circle')[0];
    checkbox.style.transform = 'scale(0)';
    window.setTimeout(() => {
        checkbox.style.display = 'none';
        circle.style.transform = 'scale(1)';
        window.setTimeout(() => {
            circle.style.animation = '1s cubic-bezier(.84,.32,.12,.58) infinite rotation360';
            window.setTimeout(openKitpcha, 200);
        }, 405);
    }, 800);
}
function kitpchaBoxClicked(n) { return function (ev) {
    const CLASS = 'kitpcha-q-activated';
    const i = 1 << n;
    if (i & kitpchaSelection) ev.target.classList.remove(CLASS);
    else ev.target.classList.add(CLASS);
    kitpchaSelection ^= i;
}}
function kitpchaSubmit(ev) {
    const succ = kitpchaSelection == kitpchas[kitpchaIndex].solution;
    if (succ) {
        if (++kitpchaIndex < kitpchas.length) changeKitpcha(kitpchaIndex);
        else {
            for (let e of document.getElementsByClassName('kitpcha-q')) e.style.display = 'none';
            kitpchaPassed = true;
            submitPressed();
        }
    }
    for (let e of document.getElementsByClassName('kitpcha-q-retry')) e.style.display = succ ? 'none' : 'inherit';
}

function kitpchaSetBoxes(n) {
    const boxes = document.querySelectorAll('.kitpcha-q-matrix > div');
    n ^= kitpchaSelection;
    for (let j = 0; j < 16; j++) if ((n >> j) & 1) kitpchaBoxClicked(j)({ target: boxes[j] });
}

function changeKitpcha(i) {
    kitpchaSetBoxes(0);
    const k = kitpchas[i];
    for (let e of document.getElementsByClassName('kitpcha-q-matrix')) {
        e.style.setProperty('--kitpcha-img', 'url(' + k.img + ')');
        e.style.setProperty('image-rendering', k.pixelated ? 'pixelated' : 'auto');
    }
    for (let e of document.getElementsByClassName('kitpcha-q-query')) {
        e.children[0].textContent = k.prompt;
    }
}

function setProgress(bar, progress, text=null) {
    progress *= 100;
    bar.children[0].style.width = progress + '%';
    bar.children[1].style.clipPath = 'inset(0 calc(100% - ' + progress + '%) 0 0)';
    if (text !== null)
        bar.parentElement.getElementsByClassName('geburtstag-progress-bar-text')[0].textContent = text;
}

function strip9(text) {
    if (text.startsWith('99.')) {
        let i = 3;
        for (; i < text.length && text.charAt(i) == '9'; i++);
        text = text.substring(0, i);
        while (!text.endsWith('9')) text = text.substring(0, text.length - 1);
        return text + '%';
    } else return null;
}

function progressBarGame(multiplier=1) {
    let bar = document.getElementById('geburtstag-progress-bar');
    let progress = 0;
    let count = 0;
    let evenFurther = (id) => {
        if (count++ < 10) {
            progress += 0.0025;
            setProgress(bar, progress);
        } else if (count > 44) {
            count = 0;
            const MAX = 95;
            bar.children[1].style.display = 'none';
            let id3 = window.setInterval(() => {
                setProgress(bar, 0.05, 'Spiele Ping-Pong...')
                bar.children[0].style.marginLeft = Math.abs((count++ % (MAX << 1)) - MAX) + '%';
            }, 10.0);
            window.setTimeout(() => {
                clearInterval(id3);
                window.setTimeout(() => {
                    bar.children[0].style.marginLeft = '0';
                    bar.children[1].style.display = 'inherit';
                    setProgress(bar, 1.0, '100%... Fertig!');
                    if (!progressBarPassed) {
                        progressBarPassed = true;
                        submitPressed();
                    }
                }, 100.0);
            }, 4000.0);
            clearInterval(id);
        } else if (count > 40) {
            progress = 0.2;
            setProgress(bar, progress, 'Lade Daten richtig hoch...');
        } else if (count > 32) {
            progress = 1.0;
            setProgress(bar, progress, '100%');
        } else if (count > 22) {
            progress += (1.0 - progress) * 0.8;
            setProgress(bar, progress, strip9((progress * 100) + ''));
        } else if (count > 18) {
            setProgress(bar, progress, 'Finalisiere doch nicht...');
        } else {
            setProgress(bar, progress, 'Finalisiere...');
            progress -= 0.007;
        }
    };
    let id = window.setInterval(() => {
        if (count++ < 50) {
            progress += 0.004;
            setProgress(bar, progress);
        } else if (count > 100) {
            progress = 0.93;
            setProgress(bar, progress);
            count = 0;
            window.setTimeout(() => {
                let id2 = window.setInterval(() => evenFurther(id2), 1400 * multiplier);
            }, 2000 * multiplier);
            clearInterval(id);
        }
    }, 300 * multiplier);
}

function openKitpcha() {
    let box = document.getElementsByClassName('kitpcha-q')[0];
    box.style.display = 'flex';
}

let enc = new TextEncoder();
function m(a, b) { let r = new Uint8Array(a.length+b.length); r.set(a); r.set(b, a.length); return r; }
class PdfRef { constructor(n) { this.n = n; } }
function Ref(n) { return new PdfRef(n); }
class PdfText { constructor(text, font, size, pos)
    { [this.text, this.font, this.size, this.pos] = [text, font, size, pos]; } }
class PdfString { constructor(text) { this.text = text; } }
class PdfRgb { constructor(r, g, b, mode) { [this.rgb, this.mode] = [[r, g, b], mode]; } }
class PdfGrey { constructor(g, mode) { [this.g, this.mode] = [g, mode]; } }
class PdfRect { constructor(x, y, w, h) { [this.x, this.y, this.w, this.h] = [x, y, w, h]; } }
class PdfFill { constructor() {} }
class PdfMove { constructor(x, y) { this.pos = [x, y]; } }
class PdfLineTo { constructor(x, y) { this.pos = [x, y]; } }
class PdfStroke { constructor() { } }
class PdfSaveGS { constructor() {} }
class PdfLoadGS { constructor() {} }
class PdfLineWidth { constructor(n) { this.n = n; } }
class PdfLineJoinStyle { constructor(n) { this.n = n; } }
class PdfPaintShading { constructor(name) { this.name = name; } }
class PdfTranslate { constructor(x, y) { this.pos = [x, y]; } }
class PdfTextLead { constructor(n) { this.n = n; } }
class PdfCSpace { constructor(n) { this.n = n; } }
class PdfHScale { constructor(n) { this.n = n; } }
function formatFloat(x) { x = x.toFixed(3); while (x.endsWith('0')) x = x.substring(0, x.length-1); return x; }
const CP1252UPPER = '€\x00‚ƒ„…†‡ˆ‰Š‹Œ\x00Ž\x00\x00‘’“”•–—˜™š›œ\x00žŸ\xa0¡¢£¤¥¦§¨©ª«¬\xad®¯°±²³´µ¶·¸¹º»¼½¾¿ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖ×ØÙÚÛÜÝÞßàáâãäåæçèéêëìíîïðñòóôõö÷øùúûüýþÿ';
function convertToCp1252(s) {
    return Array.from(s).map(c => {
        const idx = c.codePointAt(0);
        if (idx < 0x20) return '';
        if (idx < 0x7f) return (c == 0x28 || c == 0x29 || c == 0x5c ? '\\' : '') + c;
        else if (idx > 0x7f) {
            const p = CP1252UPPER.indexOf(c);
            if (p >= 0) return '\\' + (p + 0x80).toString(8);  // No need to pad 0's because p+0x80 > 0o100
        }
        return '';
    }).join('');
}

function getFullName() {
    const [spitzname, name, vorname] = ['.step-intro input', 'p input[placeholder="Name"]', 'p input[placeholder="Vorname"]']
        .map(q => document.querySelector(q).value.trim());
    return vorname + ' "' + spitzname + '" ' + name;
}

function getFullTime() {
    let delta = Date.now() - TIME_START;
    if (delta < 60000) setAchivement('speedrunner');
    const millis = delta % 1000;
    delta = Math.floor(delta / 1000);
    const secs = delta % 60;
    delta = Math.floor(delta / 60);
    const mins = delta % 60;
    delta = Math.floor(delta / 60);
    let time = [];
    if (delta > 0) time.push(delta + ' Stunde' + (delta > 1 ? 'n' : ''));
    if (mins > 0) time.push(mins + ' Minute' + (mins > 1 ? 'n' : ''));
    time.push(secs + '.' +  (millis + '').padStart(3, '0') + ' Sekunden');
    return time.join(', ');
}

function generatePdfStream(cmds) {
    let res = [];
    for (const obj of cmds) {
        if (obj instanceof PdfText) {
            const lines = obj.text.split('\n').map(line => '(' + convertToCp1252(line) + ')');
            const data = lines[0] + 'Tj' + lines.slice(1).map(s=>s+"'").join("");
            res.push(enc.encode('BT /' + obj.font + ' ' + obj.size + ' Tf '
                + obj.pos[0] + ' ' + obj.pos[1] + ' Td ' + data + ' ET'));
        } else if (obj instanceof PdfRgb) {
            const r = obj.rgb.map(n=>formatFloat(n/255)).join(' ') + ' ' + (obj.mode === 'fill' ? 'rg' : 'RG');
            res.push(enc.encode(r));
        } else if (obj instanceof PdfGrey) {
            const r = formatFloat(obj.g/255) + ' ' + (obj.mode === 'fill' ? 'g' : 'G');
            res.push(enc.encode(r));
        } else if (obj instanceof PdfRect) {
            res.push(enc.encode([obj.x, obj.y, obj.w, obj.h].join(' ') + ' re'));
        } else if (obj instanceof PdfFill) {
            res.push(enc.encode('f'));
        } else if (obj instanceof PdfMove) {
            res.push(enc.encode(obj.pos[0] + ' ' + obj.pos[1] + ' m'));
        } else if (obj instanceof PdfLineTo) {
            res.push(enc.encode(obj.pos[0] + ' ' + obj.pos[1] + ' l'));
        } else if (obj instanceof PdfStroke) {
            res.push(enc.encode('S'));
        } else if (obj instanceof PdfSaveGS) {
            res.push(enc.encode('q'));
        } else if (obj instanceof PdfLoadGS) {
            res.push(enc.encode('Q'));
        } else if (obj instanceof PdfLineWidth) {
            res.push(enc.encode(obj.n + ' w'));
        } else if (obj instanceof PdfLineJoinStyle) {
            res.push(enc.encode(obj.n + ' j'));
        } else if (obj instanceof PdfPaintShading) {
            res.push(enc.encode('/' + obj.name + ' sh'));
        } else if (obj instanceof PdfTranslate) {
            res.push(enc.encode('1 0 0 1 ' + obj.pos[0] + ' ' + obj.pos[1] + ' cm'));
        } else if (obj instanceof PdfTextLead) {
            res.push(enc.encode(obj.n + ' TL'));
        } else if (obj instanceof PdfCSpace) {
            res.push(enc.encode(obj.n + ' Tc'));
        } else if (obj instanceof PdfHScale) {
            res.push(enc.encode(formatFloat(obj.n * 100) + ' Tz'));
        } else throw new Error('unknown PDF stream command type \'' + (typeof obj) + '\'');
    }
    let stream = new Uint8Array(res.map(a=>a.length).reduce((a,b)=>a+b,0) + Math.max(0,res.length-1));
    for (let i = 0, n = 0; i < res.length; n += res[i].length+1, i++) {
        stream.set(res[i], n);
        if (i + 1 < res.length) stream[n+res[i].length] = 32;
    }
    return stream;
}

function getPdfObjById(table, id) {
    for (let i = 0; i < table.length; i++)
        if (typeof table[i]['Id'] !== 'undefined' && table[i]['Id'].startsWith(id + '/'))
            return i + 1;
    return null;
}

function generatePdfElement(obj, table) {
    if (typeof obj === 'number') return enc.encode(obj + '');
    if (typeof obj === 'boolean') return enc.encode(obj ? 'true' : 'false');
    if (typeof obj === 'string') return enc.encode(obj);
    if (obj instanceof PdfRef) {
        const id = getPdfObjById(table, obj.n);
        if (id !== null) return enc.encode(id + ' 0 R')
        throw new Error('generating PDF object with unknown reference to \'' + obj.n + '\'');
    }
    if (obj instanceof PdfString) {
        return enc.encode('(' + convertToCp1252(obj.text) + ')');
    }
    if (obj instanceof Array) {
        let r = enc.encode('[');
        for (let i = 0; i < obj.length; i++) {
            r = m(r, generatePdfElement(obj[i], table));
            if (i < obj.length - 1) r = m(r, Uint8Array.of([32]))
        }
        return m(r, enc.encode(']'));
    }
    if (typeof obj === 'object') {
        if (typeof obj['Id'] !== 'undefined') obj['Type'] = '/' + obj['Id'].split('/').at(-1);
        const isStream = obj['Type'] === '/Stream';
        if (isStream || obj['Type'] === '' || obj['Type'] === '/') delete obj['Type'];
        let stream;
        if (isStream) {
            if (typeof obj['Commands'] !== 'undefined')
                stream = generatePdfStream(obj['Commands']);
            else
                stream = obj['Raw'];
            obj['Length'] = stream.length + 1;
            delete obj['Commands'];
        }
        let r = enc.encode('<<'), s = false;
        for (let key in obj) {
            if (key === 'Id' || (isStream && key === 'Raw')) continue;
            if (s) r = m(r, Uint8Array.of([32]));
            else s = true;
            r = m(r, m(enc.encode('/' + key + ' '), generatePdfElement(obj[key], table)));
        }
        r = m(r, enc.encode('>>'));
        if (isStream) r = m(r, m(enc.encode('\nstream\n'), m(stream, enc.encode('\nendstream'))))
        return r;
    }
    throw new Error('generating PDF object with unknown type \'' + (typeof obj) + '\'');
}

function generatePdfFromTable(table) {
    let pdf = enc.encode('%PDF-1.7\n'), refs = [];
    const elems = table.length + 1;
    for (let i = 1; i < elems; i++) {
        if (i > 1) pdf = m(pdf, Uint8Array.from([10]));
        refs.push(pdf.length);
        const payload = generatePdfElement(table[i - 1], table);
        pdf = m(pdf, m(enc.encode(i + ' 0 obj '), m(payload, enc.encode('\nendobj'))));
    }
    let trailer = '<</Size ' + elems + '/Root 1 0 R';
    const metadata = getPdfObjById(table, 'metadata');
    if (metadata !== null) trailer += ' /Info ' + metadata + ' 0 R';
    pdf = m(pdf, enc.encode('\nxref\ntrailer ' + trailer + '>>\n%%EOF\n'));
    return pdf;
}

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

function showAchivement(a) {
    document.getElementById('achivement-name').textContent = a.name;
    let e = document.getElementById('achivement-popup');
    e.style.display = '';
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
        e.style.opacity = 1;
        window.setTimeout(() => {
            e.style.opacity = 0;
            window.setTimeout(() => {
                e.style.display = 'none';
            }, 500);
        }, 3000);
    }));
}

function setAchivement(id) {
    if (isAchievement(id)) return;
    const a = ACHIVEMENTS[id];
    showAchivement(a);
    let list = getAchievementList();
    list.push(id);
    localStorage.setItem('achivements', list);
}

function getAchievementList() {
    const as = localStorage.getItem('achivements');
    if (as !== null) return as.split(',');
    else return [];
}

function resetAchivements() {
    localStorage.removeItem('achivements');
}

function isAchievement(id) {
    return getAchievementList().includes(id);
}

function getAchievements() {
    let cmds = [];
    let n = 0;
    cmds.push(new PdfRgb(0x26, 0x2a, 0x30, 'fill'));
    let cds = ({});
    for (const a of Object.keys(ACHIVEMENTS)) {
        cds[a] = [n&1?120:330, 300 - (n++ >> 1) * 80];
        cmds.push(new PdfRect(cds[a][0], cds[a][1], 200, 68));
        cmds.push(new PdfFill());
    }
    for (const a of Object.keys(ACHIVEMENTS)) {
        if (!isAchievement(a)) continue;
        cmds.push(new PdfSaveGS());
        cmds.push(new PdfTranslate(cds[a][0] + 34, cds[a][1] + 32));
        cmds.push(new PdfPaintShading('S1'));
        cmds.push(new PdfLoadGS());
    }
    cmds.push(new PdfGrey(0, 'fill'));
    for (const a of Object.keys(ACHIVEMENTS)) {
        cmds.push(new PdfRect(cds[a][0] + 16, cds[a][1] + 14, 36, 36));
        cmds.push(new PdfFill());
    }
    cmds.push(new PdfGrey(255, 'stroke'));
    cmds.push(new PdfGrey(255, 'fill'));
    cmds.push(new PdfLineWidth(3));
    for (const a of Object.keys(ACHIVEMENTS)) {
        if (isAchievement(a)) {
            cmds.push(new PdfMove(cds[a][0] + 23,   cds[a][1] + 30));
            cmds.push(new PdfLineTo(cds[a][0] + 31, cds[a][1] + 22));
            cmds.push(new PdfLineTo(cds[a][0] + 44, cds[a][1] + 42));
            cmds.push(new PdfStroke());
        } else {
            cmds.push(new PdfText('?', 'F2', 28, [cds[a][0] + 27, cds[a][1] + 22]));
        }
    }
    cmds.push(new PdfTextLead(10));
    cmds.push(new PdfHScale(.86));
    cmds.push(new PdfCSpace(0));
    for (const a of Object.keys(ACHIVEMENTS)) {
        cmds.push(new PdfText(ACHIVEMENTS[a].name, 'F1', 9, [cds[a][0] + 56, cds[a][1] + 41]));
    }
    cmds.push(new PdfGrey(180, 'fill'));
    for (const a of Object.keys(ACHIVEMENTS)) {
        const desc = isAchievement(a) ? ACHIVEMENTS[a].description : '???';
        cmds.push(new PdfText(desc, 'F1', 8.5, [cds[a][0] + 56, cds[a][1] + 30]));
    }
    return cmds;
}

function generatePdf() {
    /* Possible fonts are:
        * Times-Roman
        * Times-Bold
        * Times-ltalic
        * Times-Boldltalic
        * Helvetica
        * Helvetica-Bold
        * Helvetica-Oblique
        * Helvetica-BoldOblique
        * Courier
        * Courier-Bold
        * Courier-Oblique
        * Courier-BoldOblique
        * Symbol
        * ZapfDingbats
     */
    const table = [
        {
            'Id': 'catalog/Catalog',
            'Pages': Ref('pages'),
        },
        {
            'Id': 'metadata/',
            'Title': new PdfString('Zertifikat'),
            'Author': new PdfString('Jan'),
            'Creator': new PdfString('Jan'),
        },
        {
            'Id': 'pages/Pages',
            'Kids': [Ref('page-1')],
            'Count': 1
        },
        {
            'Id': 'page-1/Page',
            'Parent': Ref('pages'),
            'Resources': Ref('resource-dict-1'),
            'MediaBox': [0, 0, 595, 842],
            'Contents': [Ref('cs-hello-world'), Ref('jandesadler-transform'), Ref('jandesadler')],
            'Annots': [Ref('annot-rickroll1')],
        },
        {
            'Id': 'annot-rickroll1/Annot',
            'Subtype': '/Link',
            'Rect': [457, 747, 590, 760],
            'A': {
                'S': '/URI',
                'URI': '(https://youtu.be/dQw4w9WgXcQ)',
            },
        },
        {
            'Id': 'resource-dict-1/',
            'Font': {
                'F1': Ref('font-helvetica'),
                'F2': Ref('font-header'),
            },
            'Shading': { 'S1': Ref('radial-shading') }
        },
        {
            'Id': 'font-helvetica/Font',
            'Subtype': '/Type1',
            'BaseFont': '/Helvetica',
            'Encoding': '/WinAnsiEncoding'
        },
        {
            'Id': 'font-header/Font',
            'Subtype': '/Type1',
            'BaseFont': '/Helvetica-Bold',
            'Encoding': '/WinAnsiEncoding'
        },
        // Function type 4 seems not to be widely supported
        /*{
            'Id': 'radial-fun/Stream',
            'FunctionType': 4,
            'Domain': [0, 1],
            'Range': [0, 1, 0, 1, 0, 1],
            'Raw': enc.encode('{ sin 1.2 mul 1.5 exp dup 1 gt { pop 1 } if dup -.531 mul .68 add exch dup -.3453 mul .51 add exch -.0718 mul .26 add }'),
        },*/
        {
            'Id': 'radial-fun/Stream',
            'FunctionType': 0,
            'Domain': [0, 1],
            'Range': [0, 1, 0, 1, 0, 1],
            'Size': [2],
            'BitsPerSample': 8,
            'Decode': [0, 1, 0, 1, 0, 1],
            'Raw': Uint8Array.of(0xad, 0x82, 0x42, 0x26, 0x2a, 0x30),
        },
        {
            'Id': 'radial-shading/',
            'ShadingType': 3,
            'Coords': [0, 0, 0, 0, 0, 31],
            'ColorSpace': '/DeviceRGB',
            'Extend': [false, false],
            'Function': Ref('radial-fun'),
        },
        {
            'Id': 'cs-hello-world/Stream',
            'Commands': Array.of([
                new PdfTextLead(14),
                new PdfHScale(1.06),
                new PdfGrey(0, 'fill'), new PdfRect(450, 790, 5, 25), new PdfFill(),
                new PdfRect(130, 460, 180, 1.2), new PdfFill(),
                new PdfRect(340, 460, 180, 1.2), new PdfFill(),
                new PdfText('Jandesamt\nfür Rickrolls\nund Rechtschreibung', 'F1', 12, [461, 806]),
                new PdfRgb(6, 69, 173, 'fill'),
                new PdfText('https://jandesamt.gov/', 'F1', 10, [461, 750]),
                new PdfRgb(255,0,0, 'fill'), new PdfRect(450, 765, 5, 25), new PdfFill(),
                new PdfRgb(255,204,0, 'fill'), new PdfRect(450, 740, 5, 25), new PdfFill(),
                new PdfHScale(.65), new PdfCSpace(4), new PdfGrey(50, 'fill'),
                new PdfText('ZERTIFIKAT', 'F2', 30, [130, 700]),
                new PdfTextLead(65), new PdfHScale(.45), new PdfCSpace(3), new PdfGrey(90, 'fill'),
                new PdfText('BESCHÄFTIGUNGS-TEST\nFÜR PROKRASTINATOREN', 'F1', 60, [130, 632]),
                new PdfHScale(.8), new PdfCSpace(.3), new PdfGrey(0, 'fill'),
                new PdfText('Name', 'F1',           10, [134, 450]),
                new PdfText('Benötigte Zeit', 'F1', 10, [344, 450]),
                new PdfHScale(.6), new PdfCSpace(.4),
                new PdfText(getFullName(), 'F2', 14, [134, 464]),
                new PdfText(getFullTime(), 'F2', 14, [344, 464]),
                new PdfHScale(.8), new PdfCSpace(.3),
                new PdfText('Achievements', 'F2', 20, [130, 380]),
            ], getAchievements()).flat(),
        },
        {
            'Id': 'jandesadler-transform/Stream',
            'Raw': enc.encode('.1 0 0 .1 390 736 cm'),
        },
        {
            'Id': 'jandesadler/Stream',
            'Filter': '/FlateDecode',
            'Raw': Uint8Array.of(120,156,125,86,187,110,28,57,16,204,249,21,252,129,37,216,47,62,82,39,6,12,92,224,75,13,71,123,88,11,198,42,80,228,223,119,117,115,102,86,222,209,25,130,180,98,237,116,177,186,89,221,28,202,21,63,23,194,159,161,84,198,152,189,105,190,190,166,183,84,243,143,196,44,165,25,231,38,133,7,229,215,204,2,0,79,200,44,83,52,179,205,82,43,62,123,33,29,153,135,148,14,88,184,204,54,243,53,75,29,69,155,165,44,163,244,49,241,133,21,85,202,141,138,9,97,41,101,142,145,71,43,99,154,63,207,140,47,44,19,113,225,198,136,151,82,123,38,39,36,240,247,94,134,38,172,173,140,238,1,108,92,90,69,0,54,24,210,50,243,8,42,2,51,43,99,77,165,145,228,233,240,240,128,78,165,107,203,80,58,43,167,124,207,47,231,44,111,137,169,66,153,230,142,199,122,247,196,123,11,162,193,165,78,68,113,247,76,44,79,10,193,0,234,44,131,130,88,33,53,120,159,73,110,137,242,15,132,162,24,100,185,213,66,149,131,123,3,20,89,77,44,53,106,220,128,90,230,54,75,235,188,173,144,0,158,106,99,45,19,86,181,52,145,35,116,95,46,234,235,1,152,21,225,61,214,8,210,231,193,188,150,41,138,179,118,222,31,216,116,109,193,127,202,190,122,130,207,153,220,220,53,81,43,54,208,180,162,71,241,2,24,165,241,74,208,136,61,76,90,199,146,241,41,251,210,101,212,194,132,236,246,7,144,172,118,57,194,247,229,162,191,62,0,133,206,177,135,103,88,195,70,219,233,211,190,190,30,251,31,15,108,234,246,240,63,212,175,60,159,18,186,37,161,94,100,44,241,4,71,188,230,29,17,168,118,143,243,228,112,136,194,188,213,176,134,233,91,111,199,26,58,4,254,168,45,61,30,169,134,198,177,7,197,182,222,55,185,30,8,121,167,65,202,70,17,13,67,157,211,177,203,6,120,200,166,99,71,118,157,59,197,115,38,158,240,57,187,91,114,183,184,38,152,186,147,67,136,175,104,98,66,71,185,120,180,128,186,217,16,197,138,114,57,128,185,192,104,54,70,103,77,210,104,138,19,205,45,233,44,134,230,36,52,187,183,230,107,134,173,200,144,67,93,101,184,123,251,138,247,66,237,8,246,230,106,171,217,162,195,76,130,248,196,2,98,116,189,15,7,240,116,117,127,18,181,98,13,77,170,37,120,9,227,193,7,151,7,173,174,53,89,197,161,137,254,90,138,79,44,24,15,16,132,70,138,68,171,196,225,227,4,219,202,116,192,178,247,172,91,119,185,68,255,4,2,251,240,176,85,176,138,205,210,203,153,8,162,81,197,25,135,143,100,163,171,156,202,86,174,56,106,16,141,25,181,115,213,109,206,216,12,121,172,130,201,180,165,250,68,3,106,100,213,230,74,197,167,2,168,71,47,106,61,10,227,190,2,21,236,82,101,230,217,183,202,170,107,131,79,6,140,197,180,184,79,60,40,9,246,209,217,178,85,180,219,106,8,14,81,86,181,84,118,38,70,217,77,225,184,105,49,104,221,49,248,14,45,40,216,205,157,19,37,57,17,129,28,227,157,145,49,123,230,115,141,20,220,60,195,221,140,52,123,176,251,17,128,93,121,22,60,239,167,139,66,19,230,175,226,22,170,184,77,238,201,123,249,68,181,166,114,141,159,127,63,103,92,40,115,52,8,248,133,97,246,5,191,63,211,183,239,185,150,154,255,75,154,255,201,111,153,242,165,122,141,48,22,44,63,254,163,96,192,221,73,40,21,163,35,20,247,138,54,223,130,38,52,133,54,71,252,12,23,130,105,48,129,212,80,27,81,15,0,165,56,19,125,202,95,159,213,26,169,55,203,175,228,194,252,252,145,161,185,194,237,191,67,150,224,180,42,142,148,167,223,210,203,181,184,120,253,94,13,196,61,26,8,170,106,126,95,6,16,65,250,64,32,235,76,116,146,69,101,226,250,93,170,226,18,28,222,101,241,162,177,175,54,85,236,55,104,76,48,92,58,226,57,10,12,35,210,15,228,190,16,205,4,151,75,117,96,5,245,13,153,91,43,61,19,185,170,184,143,112,212,62,239,25,102,103,27,238,30,244,180,15,146,120,63,17,141,196,13,141,8,175,112,219,122,74,208,174,238,86,197,200,53,247,111,184,231,68,245,255,238,121,243,116,223,57,229,242,129,85,46,162,96,199,4,80,212,148,197,199,214,69,48,53,173,211,1,221,119,136,179,226,106,163,222,3,218,3,23,180,222,100,62,160,251,187,99,46,239,44,115,118,204,133,112,234,132,43,215,55,89,175,48,23,196,226,58,213,3,186,239,16,238,95,105,133,100,65,30,8,71,45,104,108,234,206,116,127,53,206,229,157,115,62,48,78,195,164,134,85,187,55,183,191,181,225,157,148,113,201,236,192,125,1,232,40,20,111,74,140,8,15,145,119,192,203,153,197,21,125,253,13,101,139,48,184)
        }
    ];
    let bin = generatePdfFromTable(table);
    let ov = 0, b64 = '', v1, v2, v3;
    for (let i = 0; i < bin.length; i += 3) {
        ov = bin.length - i;
        if (ov < 3) bin = m(bin, new Uint8Array(3 - ov));
        [v1, v2, v3] = bin.slice(i, i + 3);
        for (const x of [v1>>2,((v1&3)<<4)|(v2>>4),((v2&15)<<2)|(v3>>6),v3&63]) b64 += B64[x];
    }
    if (ov < 3 && ov > 0) b64 = b64.substring(0, b64.length - 3 + ov) + '='.repeat(3 - ov);
    return b64;
}

function enablePdfLink() {
    let a = document.getElementById('download-file');
    const pdf = generatePdf();
    a.setAttribute('href', 'data:application/pdf;base64,' + pdf);
}

for (let e of document.getElementsByClassName('pin')) {
    e.addEventListener('dragstart', pinDown);
    e.addEventListener('dragend', pinUp);
}

/*
kitpchaPassed = true;
anmeldenPinned = true;
step = 'flee';
submitPressed();
*/
