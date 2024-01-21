var swiper1 = new Swiper(".mySwiper-1", {
    slidesPerView: 1,
    spaceBetween: 30,
    loop: true,
    pagination: {
        el: ".swiper-pagination",
        clickable: true,
    },
    navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev"
    }
});

var swiper2 = new Swiper(".mySwiper-2", {
    slidesPerView: 3,
    spaceBetween: 30,
    loop: true,
    navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev"
    },
    breakpoints: {
        0: {
            slidesPerView: 1
        },
        520: {
            slidesPerView: 2
        },
        950: {
            slidesPerView: 3
        }
    }
});


// ----------------------------------------------------------------------------------------------------------
// ------------- carrito ------------------------------------------------------------------------------------
// ----------------------------------------------------------------------------------------------------------

const carrito= document.getElementById('carrito');

const elementos2= document.getElementById('lista-2');
const elementos3= document.getElementById('lista-3');

const lista= document.querySelector('#lista-carrito tbody');
const vaciarCarritoBtn= document.getElementById('vaciar-carrito');


cargarEventListeners();


function cargarEventListeners(){
    elementos2.addEventListener('click', comprarElemento);
    elementos3.addEventListener('click', comprarElemento);

    carrito.addEventListener('click', eliminarElemento);

    vaciarCarritoBtn.addEventListener('click', vaciarCarrito);
}

function comprarElemento(e){
    e.preventDefault();
    if(e.target.classList.contains('agregar-carrito')){
        const elemento= e.target.parentElement.parentElement;
        leerDatosElemento(elemento);
    }
}

function leerDatosElemento(elemento){
    const infoElemento= {
        imagen: elemento.querySelector('img').src,
        titulo: elemento.querySelector('h3').textContent,
        precio: elemento.querySelector('.precio').textContent,
        id: elemento.querySelector('a').getAttribute('data-id')
    }

    insertarCarrito(infoElemento);
}


function insertarCarrito(elemento){
    const row= document.createElement('tr');
    row.innerHTML=`
        <td>
            <img src="${elemento.imagen}"  width="90" style="margin-top: 10px; margin-right: 3px;">  
        </td>

        <td>
            ${elemento.titulo}
        </td>

        <td>
            ${elemento.precio}
        </td>

        <td>
            <a herf="#" class="borrar" data-id="${elemento.id}" style="margin-left: 10px;">X</a>
        </td>

    `;
    // ojo a esta comilla de arriba

    lista.appendChild(row);
}


function eliminarElemento(e){
    e.preventDefault();
    let elemento,
        elementoId;

    if(e.target.classList.contains('borrar')){
        e.target.parentElement.parentElement.remove();
        elemento= e.target.parentElement.parentElement;
        elementoId= elemento.querySelector('a').getAttribute('data-id');
    }
}

function vaciarCarrito(){
    while(lista.firstChild){
        lista.removeChild(lista.firstChild);
    }
    return false;
}



// -----------------------------------------------------------------------------------------------------
// ------------------------- Animated Background -------------------------------------------------------
// -----------------------------------------------------------------------------------------------------


const animatedSection = document.getElementById('animated-section');
const canvas = document.createElement('canvas');
animatedSection.appendChild(canvas);

/** @type {HTMLCanvasElement} */
const gl = canvas.getContext('webgl2');
const dpr = window.devicePixelRatio;

const vertexSource = `#version 300 es
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

in vec2 position;

void main(void) {
    gl_Position = vec4(position, 0., 1.);
}
`;

const fragmentSource = `#version 300 es
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

out vec4 fragColor;

uniform vec2 resolution;
uniform float time;

#define S smoothstep
#define T .112358+time

float rnd(vec2 p) {
    return fract(
        sin(
            dot(
                p,
                vec2(12.9898, 78.233)
            )
        )*43758.5453123
    );
}

float noise(vec2 p) {
    vec2 f=fract(p), i=floor(p);
    float
    a=rnd(i),
    b=rnd(i+vec2(1,0)),
    c=rnd(i+vec2(0,1)),
    d=rnd(i+vec2(1,1));

    vec2 u = f*f*(3.-2.*f);

    return mix(a,b,u.x)+
        (c-a)*u.y*(1.-u.x)+
        (d-b)*u.y*u.x;
}

void main(void) {
    vec2 uv = (
        gl_FragCoord.xy -.5 * resolution.xy
    )/min(resolution.x, resolution.y);

    float t = T*.1;
    vec3 col = vec3(0);
    vec2 p = vec2(0);
    p.x = noise(uv+vec2(0,1));
    p.y = noise(uv+vec2(1,0));

    p = 8.*(
        vec2(
            sin(t),
            -cos(t)
        )*.15-p
    );

    float s = .35;

    for(float i=.0;i<6.;i++) {
        p.x += s*sin(2.*t-i*1.5*p.y)+t;
        p.y += s*cos(2.*t+i*1.5*p.x)-t;
    }

    col+= sin(t+p.x+p.y);
    col = pow(S(vec3(0),vec3(1),col), vec3(.4));
    col = mix(vec3(.7,.6,.4)*col, col, col);

    float
    stp = 2.,
    prog = T*.2,
    anim = floor(mod(prog-.5,stp));

    if(anim == .0) {
        prog -= length(uv)*.2;
    } else {
        prog -= min(abs(uv.x),abs(uv.y))*.2;
    }
    float scene = floor(mod(prog,stp));
    if(scene == .0) {
        col = 1.-col;
    } 

    fragColor = vec4(col,1);
}
`;

let time;
let buffer;
let program;
let resolution;
let vertices = [];

function resize() {
    const {
        innerWidth: width,
        innerHeight: height
    } = window;

    canvas.width = width * dpr;
    canvas.height = height * dpr;

    gl.viewport(0, 0, width * dpr, height * dpr);
}

function compile(shader, source) {
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error(gl.getShaderInfoLog(shader));
    }
}

function setup() {
    const vs = gl.createShader(gl.VERTEX_SHADER);
    const fs = gl.createShader(gl.FRAGMENT_SHADER);

    program = gl.createProgram();

    compile(vs, vertexSource);
    compile(fs, fragmentSource);

    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error(gl.getProgramInfoLog(program));
    }

    vertices = [
        -1.0, -1.0,
        1.0, -1.0,
        -1.0, 1.0,
        -1.0, 1.0,
        1.0, -1.0,
        1.0, 1.0
    ];

    buffer = gl.createBuffer();

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    const position = gl.getAttribLocation(program, "position");

    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    time = gl.getUniformLocation(program, "time");
    resolution = gl.getUniformLocation(program, 'resolution');
}

function draw(now) {
    gl.clearColor(0, 0, 0, 1.);
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);

    gl.uniform1f(time, now*.001);
    gl.uniform2f(
        resolution,
        canvas.width,
        canvas.height
    );
    gl.drawArrays(gl.TRIANGLES, 0, vertices.length * .5);
}

function loop(now) {
    draw(now);
    requestAnimationFrame(loop);
}

function init() {
    setup();
    resize();
    loop(0);
}

document.body.onload = init;
window.onresize = resize;




// ---------------------------------------------
