const interval = 10;
var timer;


addEventListener('message', function(ev){
    if(ev.data == "start"){
	clearInterval(timer);
	timer = setInterval(function(){
	    postMessage('tick');
	}, interval);
    }else{
	clearInterval(timer);
    }
});
