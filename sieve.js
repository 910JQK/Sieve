/*

記錄：
	14.12.27
	實現方式待改進

*/


//"use strict";
var Prime = ['-', '-', true];
var Blocks = [];
var mainview, ctx, score_label, right_edge
var worker_move, timer_create;
var count = 0;
var score = 0;
var running = false;
var click_enabled = true;


const speed = 10;
const step = 100;
const create_interval = 800;
const text_font = "bold 24px sans-serif";
const title_font = "bold 48px sans-serif";


function $(selector){
    return document.querySelector(selector);
}


function printf(args){
    var str = arguments[0];
    var i;
    for(i=1; i<arguments.length; i++){
	str = str.replace("%"+i, arguments[i]);
    }
    return str;
}


function cls(){
    ctx.clearRect(0, 0, 400, 600);
}


function init(){
    mainview = $("#mainview");
    score_label = $("#score_label");
    range_label = $("#range_label");
    ctx = mainview.getContext("2d");
    mainview.addEventListener("click", click_event);

    worker_move = new Worker("worker.js");
    worker_move.addEventListener('message', move);

    ctx.textAlign = "center";
    ctx.font = title_font;
    ctx.fillText("Is it a prime?", 200, 250);
    ctx.font = text_font;
    ctx.fillText("click all the composite numbers", 200, 300, 400);
    ctx.fillText("click to start", 200, 350);
    ctx.textAlign = "left";
}


function game_start(){
    Blocks = [];
    count = 0;
    score = 0;
    update_score(0);


    work(2, step);
    update_range();

    timer_create = setInterval(create, create_interval);
    worker_move.postMessage("start");
    running = true;

    cls();
    render();
}


function work(left, right){
    var limit = Math.ceil(Math.sqrt(right+1));
    var i, t;
    for(i=left+1; i<=right; i++)
	Prime[i] = true;
    for(i=2; i<limit; i++){
	if(Prime[i]){
	    t = i;
	    while(true){
		t += i;
		if(t > right)
		    break;
		Prime[t] = false;
	    }
	}
    }
    right_edge = right;
} 


function debug(){
    var s = "";
    for(i=2; i<Prime.length; i++)
	if(Prime[i])
	    s = s + i + " ";
    console.log(s);
}


function Block(x, y, number){
    this.x = x;
    this.y = y;
    this.l = 100;
    this.t = 0;
    this.number = number;
    if(!Block._init){
	Block.prototype.in_range = function(x, y){
	    //console.log(printf("X: %1, this.x: %2, Y: %3, this.y: %4", x, this.x, y, this.y));
	    return (x > this.x && x < this.x+this.l && y > this.y && y < this.y+this.l);
	}
    }
    Block._init = true;
}


function gen_number(){
    if(right_edge == step)
	return right_edge-((step-2)*Math.random()).toFixed();
    return right_edge-(step*Math.random()).toFixed();
}


function create(){
    var current = 0;
    if(count > step){
	count = 0;
	work(right_edge+1, right_edge+step);
	update_range();
    }
    count++;
    
    current = gen_number();
    var block = new Block(200*Math.random(), 0, current++);
    Blocks.push(block);
}


function move(){
    var i;
    if(Blocks[0]){
	if(Blocks[0].y > 600){
	    if(!Prime[Blocks[0].number])
		game_over(printf("%1 is not a prime!", Blocks[0].number));
	    Blocks.shift();
	}
    }
    for(i=0; i<Blocks.length; i++){
	Blocks[i].t++;
	Blocks[i].y = speed*Blocks[i].t/10;
    }
}


function render(){
    if(running){
	cls();
	var i;
	for(i=0; i<Blocks.length; i++){
	    ctx.fillText(Blocks[i].number, Blocks[i].x, Blocks[i].y);
	    ctx.strokeRect(Blocks[i].x, Blocks[i].y, Blocks[i].l, Blocks[i].l);
	}
	requestAnimationFrame(render);
    }
}


function click_event(ev){
    if(click_enabled){
	/*
	  console.log("click_event");
	  console.log(ev);
	*/
	
	if(!running){
	    game_start();
	    return;
	}
	
	//var X = ev.layerX;
	var X = ev.pageX-mainview.offsetLeft;
	var Y = ev.layerY;
	
	var i;
	for(i=0; i<Blocks.length; i++){
	    /*
	      console.log(printf("checking block #%1", i));
	      console.log(printf("layerX %1, layerY %2", ev.layerX, ev.layerY));
	      console.log(printf("X %1, Y %2", Blocks[i].x, Blocks[i].y));
	    */
	    if(Blocks[i].in_range(X, Y)){
		var number = Blocks[i].number;
		if(!Prime[number]){
		    Blocks.splice(i, 1);
		    update_score(1);
		}else{
		    game_over(printf("%1 is a prime!", number));
		}
	    }
	}
    }
}


function update_score(delta){
    score += delta;
    score_label.textContent = score;
}


function update_range(){
    var left = (right_edge - step)? (right_edge - step + 1): 2;
    range_label.textContent = printf("[%1, %2]", left, right_edge);
}


function game_over(message){
    running = false;
    clearInterval(timer_create);
    worker_move.postMessage("stop");
    cls();
    
    click_enabled = false;
    setTimeout(function(){
	click_enabled = true;
    }, 400);
    
    ctx.textAlign = "center";
    ctx.font = title_font;
    ctx.fillText("Game Over!", 200, 250);
    ctx.font = text_font;
    ctx.fillText(message, 200, 300, 400);
    ctx.fillText(printf("Your score: %1", score), 200, 325, 400);
    ctx.fillText("click to restart", 200, 375);
    ctx.textAlign = "left";

    console.log(printf("%1, score=%2", Date(), score));
}
