const root = document.querySelector(':root');
const body = document.querySelector('body');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const ballAltitudeDiv = document.getElementById('ballAltitude');
const ballAltitudeMeter = document.querySelector('#ballAltitude > .rectangle');
const ballAltitudeTarget = document.querySelector('#ballAltitude > .target');
const shotType = document.getElementById('shotType');
let hasOnErrorFunction = false;
const scoreboard = {
    serving: [document.querySelector('#scoreboard > .serving > div:nth-child(1)'), document.querySelector('#scoreboard > .serving > div:nth-child(2)')],
    sets: [document.querySelector('#scoreboard > .sets > div:nth-child(1)'), document.querySelector('#scoreboard > .sets > div:nth-child(2)')],
    games: [document.querySelector('#scoreboard > .games > div:nth-child(1)'), document.querySelector('#scoreboard > .games > div:nth-child(2)')],
    points: [document.querySelector('#scoreboard > .points > div:nth-child(1)'), document.querySelector('#scoreboard > .points > div:nth-child(2)')]
}

let seededRandom = (seed, multiplier = 0) => {
    multiplier++;
    return Math.acos(Math.sin(Math.floor(seed)**(Math.E * multiplier)))/(1.5*Math.PI);
}

let storageObj = {};

StorageManager.getStorageObj();

let frame = {
    windowWidth: window.innerWidth,
    windowHeight: window.innerHeight
};
let keyboard = {
    ShiftLeft: false,
    ShiftRight: false
}
let keyboardQueries = {};
let keyboardOffQueries = {};
let deltaTime = 0;
let potentialDeltaTime = 0;
let previousTime;
let cDim = {
    x: 8.23,
    y: 23.77,
    sby: 6.4,
    bby: 5.48,
    totalX: 10.97,
    alleyX: (10.97-8.23)/2
};
let mScale = frame.windowHeight*0.8/cDim.y;
let courtOffset = {
    x: frame.windowWidth/2 - mScale*cDim.x/2,
    y: frame.windowHeight/2 - mScale*cDim.y/2
};

function adjustCanvas(canvas, ctx) {
    // Get the device pixel ratio
    let dpr = window.devicePixelRatio || 1;

    // Get the width and height of the window
    let rect = canvas.getBoundingClientRect();

    // Adjust the canvas to use the device pixel ratio
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    // Scale the context to counter the effect of setting the canvas width and height
    ctx.scale(dpr, dpr);

    // Make the canvas take up the whole window
    canvas.style.width = '100%';
    canvas.style.height = '100%';
}

document.addEventListener('keydown', (event) => {
    if(event.key == 'Shift') {
        keyboard[event.code] = true;
    } else {
        keyboard[event.key.toLowerCase()] = true;
    }

    if(event.key == 'D' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();
        if(!hasOnErrorFunction) {
            window.onerror = function (message, source, lineno, colno, error) {
                alert(`An error occurred: ${message}`);
            };
        }
        hasOnErrorFunction = true;
    }
});

document.addEventListener('keyup', (event) => {
    if(event.key == 'Shift') {
        keyboard[event.code] = false;
    } else {
        keyboard[event.key.toLowerCase()] = false;
    }
});

{
    function blendColors(color1, color2, ratio) {
        // Ensure the ratio is clamped between 0 and 1
        ratio = Math.max(0, Math.min(1, ratio));
    
        // Calculate the blended RGB values
        const r = Math.round(color1[0] + (color2[0] - color1[0]) * ratio);
        const g = Math.round(color1[1] + (color2[1] - color1[1]) * ratio);
        const b = Math.round(color1[2] + (color2[2] - color1[2]) * ratio);
    
        // Return the resulting color as a string
        return `rgb(${r},${g},${b})`;
    }

    let div = document.querySelector('.cylinder-title');
    let text = div.textContent;
    div.innerHTML = '';
    for(let i = 0; i < text.length; i++) {
        let span = document.createElement('span');
        for(let j = 0; j < 20; j++) {
            let s = document.createElement('span');
            s.innerHTML = text[i];
            s.style.transform = `rotateY(${30 - 2 * i / text.length * 30}deg) rotateX(10deg) translateZ(${j}px)`;
            s.style.zIndex = 1000 - j;
            s.style.color = blendColors([186, 150, 49], [102, 98, 48], j/20);
            span.appendChild(s);
        }
        div.appendChild(span);
    }
}

// Call the function with the canvas and context
adjustCanvas(canvas, ctx);
Render.instantiate();
HomeScreen.instantiate();
AudioManager.preloadAudio();

let gameFunction = () => {
    if(Match.paused || Match.match == null) return;


    if(previousTime == undefined) {
        previousTime = Date.now();
        requestAnimationFrame(gameFunction);
        return;
    }
    let currentTime = Date.now();
    deltaTime = (currentTime - previousTime)/1000;
    potentialDeltaTime = deltaTime;
    previousTime = currentTime;
    if(Render.hawkeyeVision && Render.hawkeyeVision.t > 0) {
        deltaTime = 0;
        Render.drawCourt();
        Player.players[0].draw();
        Player.players[1].draw();
        BallShadow.updateShadows();
        requestAnimationFrame(gameFunction);
        return;
    }
    if(deltaTime > 0.5) {
        requestAnimationFrame(gameFunction);
        return;
    }
    if(Match.point.receiving != undefined && Ball.ball != undefined && (Player.players[Match.point.receiving].x - Ball.ball.x)**2 + ((Player.players[Match.point.receiving].y-Player.players[Match.point.receiving].width/2*Player.players[Match.point.receiving].directionCorrect) - Ball.ball.y)**2 < (Player.shoulderToRacket + Player.centerToShoulder)**2 * 2) {
        deltaTime /= 7.5;
        if(Player.players[Match.point.receiving].windingUp != undefined) {
            deltaTime = 0;
        }
    }
    frame.windowWidth = window.innerWidth;
    frame.windowHeight = window.innerHeight;
    adjustCanvas(canvas, ctx);

    Object.keys(keyboard).forEach(key => {
        if(keyboard[key]) {
            if(keyboardQueries[key] != undefined && !(Player.players[Match.game.serving] instanceof Ai)) {
                keyboardQueries[key]();
            }
        } else {
            if(keyboardOffQueries[key] != undefined) {
                keyboardOffQueries[key]();
            }
        }
    });

    Render.drawCourt();

    Player.updatePlayers();

    BallShadow.updateShadows();

    if(Ball.ball) {
        Ball.ball.update();
        ballAltitudeMeter.style.height = `${(1-(7.5-Ball.ball.z)/7.5)*100}%`;
        Ball.ball.draw();
        Ball.ball.previousVelocity = Math.sqrt(Ball.ball.hVelocity**2 + Ball.ball.vVelocity**2);
    }

    requestAnimationFrame(gameFunction);
}

storageObj.loginInfo.day = Challenge.getDay();
storageObj.loginInfo.week = Challenge.getWeek();
if(storageObj.todaysTournaments.current != null) storageObj.todaysTournaments.current.setActive();
StorageManager.save();