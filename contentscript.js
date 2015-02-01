videos = document.getElementsByTagName('video');
console.log(videos[0]);

function loopVideos(whatdo){
	//console.log('enterloopvideos');
	for (var i = 0; i <videos.length; i ++){
		console.log("loopvideos: " + whatdo);
		if (whatdo == "changeVolume"){ // changes volume
			changeVolume(videos[i]);
		} else if (whatdo == "changeSpeed"){ // changes speed
			console.log('changeSpeed');
			changeSpeed(videos[i]);
		} else if (whatdo == "pauseVideo"){
			pauseVideo(videos[i]);
		} else if (whatdo == "playVideo"){
			playVideo(videos[i]);
		}
	}
}

function pauseVideo(video){
	video.pause();
}

function playVideo(video){
	video.play();
}

function changeSpeed(video){
	console.log('changeSpeed');
	//console.log(video);
	video.playbackRate = data.multiplier; // THIS
	//console.log('why');
}

function changeVolume(video){
	console.log(video.volume);
	video.volume = Math.min(Math.max(0, data.volume - .4), 1);
	video.volume = Math.min(Math.pow(video.volume,2) / 0.9,1);
	console.log(video.volume);
}







var ws = new WebSocket("ws://127.0.0.1:10138/myo/3");
ws.onopen = function(e) {
	console.log("Websocket open",e);
};
ws.onclose = function(e) {
	console.log("Websocket closed",e);
};
ws.onerror = function(e) {
	console.log("Websocket error",e);
};
var data = {orientation:{ pitch:0, roll:0, yaw:0},
zeroed: false,
maxZ: 0,
maxY: 0,
minZ: 0,
minY: 0,
zeroYaw: 0,
zeroPitch: 0,
zeroRoll: 0,
direction: "down",
volume: 1,
recentTimeInterval: [0,0,0,0,0,0,0], //7 beats, i.e. 2 bars - 1 beat
avgTimeInterval: 0, //millisec dt
recentIndex: 0,
isCalibrating: true,
multiplier: 1,
prevTime: 0,
orientationDataStarted: false
};

ws.onmessage = function(e) {
	//console.log("echo from server : " + e.data);
	var json = JSON.parse(e.data);
	var jsondata = json[1];
	//console.log(jsondata);
	if (jsondata.type === "orientation") {
		//console.log("RAW DATA: " jsondata);
		//console.log(jsondata["orientation"]);
		if (!data.orientationDataStarted){
			data.orientationDataStarted=true;
			console.log("Not dead.");
			console.log(jsondata);
		}
		//console.log("Not dead.");
		var x = jsondata.orientation.x;
		var y = jsondata.orientation.y;
		var z = jsondata.orientation.z;
		var w = jsondata.orientation.w;

		var yaw   = -Math.atan2(2*x*y + 2*w*z, w*w + x*x - y*y - z*z);
		var pitch = -Math.asin(2*w*y - 2*x*z);
		var roll  = Math.atan2(2*y*z + 2*w*x, -w*w + x*x + y*y - z*z); //doesn't work
		//console.log(yaw,pitch,roll);
		data.orientation.roll = roll;
		data.orientation.pitch = pitch;
		data.orientation.yaw = yaw;
		//console.log(data.orientation);

		/*} else if (jsondata["type"] === "locked") {
		console.log("Locked");*/
	} else if (jsondata.type === "pose"){

		var type = jsondata["pose"];
		console.log(type);
		if (type === "wave_in"){
			zero();
		} else if (type === "wave_out"){
			for (var i=0; i<data.recentTimeInterval.length; ++i){
				data.recentTimeInterval[i]=data.avgTimeInterval;
			}
			data.prevTime=0;
			data.recentIndex=0;
			data.multiplier=1;
			loopVideos("changeSpeed");
		} else if (type === "fist") {
			pause();
		} else if (type === "rest"){
			resume();
		}
	} else {
		console.log(jsondata);
	}

};

function addRad(a, b) { //Adds the angles a and b
	var c = a + b;

	if (c > Math.PI) {
		c = c - 2*Math.PI;
	}

	return c;
}


function diffRad (a, b) { //Finds the angle from a to b
	var c = b - a;

	if (c < 0){
		c = c + 2*Math.PI;
	}

	return c;
}

function zero() {
	console.log("Zeroed.");
	data.zeroYaw = data.orientation.yaw;
	data.zeroPitch = data.orientation.pitch;
	data.zeroRoll = data.orientation.roll;
	data.maxZ = data.zeroYaw;
	data.minZ = data.zeroYaw;
	data.maxY = data.zeroPitch;
	data.minY = data.zeroPitch;

	data.zeroed = true;
	data.direction = "down";
	data.isCalibrating = true;
	data.recentIndex=0;
	for (var i=0; i<data.recentTimeInterval.length; ++i) {
		data.recentTimeInterval[i]=0;
	}
	data.prevTime =0;
	data.multiplier=1;
	loopVideos("changeSpeed");
}

function up() {
	console.log("UP");
	console.log("VOLUME " + data.volume);
	data.direction = "down";
	trackTime();
}

function down() {
	console.log("DOWN");
	console.log("VOLUME " + data.volume);
	data.direction = "right";
	trackTime();
}

function right() {
	console.log("RIGHT");
	console.log("VOLUME " + data.volume);
	data.direction = "left";
	trackTime();
}

function left() {
	console.log("LEFT");
	console.log("VOLUME " + data.volume);
	data.direction = "up";
	trackTime();
}

function trackTime() {
	if (data.prevTime ===0){
		data.prevTime = (new Date()).getTime();
		return;
	} else {
		var curTime = (new Date()).getTime();
		var dt = curTime - data.prevTime;
		data.prevTime = curTime;

		if (data.isCalibrating){

			var idx = data.recentIndex;
			console.log("Calibrating beat: "+idx);

			data.recentTimeInterval[idx] = dt;
			idx++;
			data.recentIndex = idx;

			if (idx>=data.recentTimeInterval.length){ // is 7 beats, done calibrating
				var sum = 0;
				for (var i=0; i< data.recentTimeInterval.length; ++i){
					sum+= data.recentTimeInterval[i];
				}
				data.recentIndex = 0;

				data.avgTimeInterval = sum/data.recentTimeInterval.length;

				console.log("Calibration done with 16-1 beats.");
				console.log("Average beat: "+data.avgTimeInterval);
				data.isCalibrating =false;
			}
		} else {
			var idx = data.recentIndex;
			data.recentTimeInterval[idx] = dt;
			idx = (idx+1)%(data.recentTimeInterval.length);
			data.recentIndex=idx;
			var sum = 0;
			for (var i=0; i< data.recentTimeInterval.length; ++i){
				sum+= data.recentTimeInterval[i];
			}
			console.log("sum: "+sum);
			console.log("currentavg: "+(sum/data.recentTimeInterval.length));


			var multiplier = data.avgTimeInterval/(sum/data.recentTimeInterval.length);

			data.multiplier = multiplier;
			console.log("Multiplier set to: "+ multiplier);
			console.log("avgtimeint: "+ data.avgTimeInterval);
			console.log("dt: ", dt);
			setVideoTime(multiplier);

		}


		loopVideos("changeVolume");


	}
}

function setVideoTime(multiplier){
	loopVideos("changeSpeed");
}

function resume() {
	loopVideos("playVideo");
}

function pause() {
	loopVideos("pauseVideo");
}

function loop() {
	if (data.zeroed){
		if (data.direction ==="up"){
			data.maxY = Math.max(data.orientation.pitch, data.maxY);
		} else if (data.direction ==="down"){
			data.minY = Math.min(data.orientation.pitch, data.minY);
		} else if (data.direction ==="right"){
			data.maxZ = Math.max(data.orientation.yaw, data.maxZ);
		} else if (data.direction ==="left"){
			data.minZ = Math.min(data.orientation.yaw, data.minZ);
		}
		//console.log("we");
		detectEdge();
	} else{
		//console.log("notwe");
	}
}

function detectEdge() {
	if (data.direction === "down") {
		if (diffRad(data.zeroPitch, data.orientation.pitch) < 6.2 && diffRad(data.zeroPitch, data.orientation.pitch) > Math.PI){
			if (diffRad (data.zeroPitch, data.orientation.pitch) > 1.05 * diffRad (data.zeroPitch, data.minY)) {
				data.volume = volumizer (data.volume, 2*Math.PI - diffRad(data.zeroPitch, data.minY));
				down();
				data.minY = data.zeroPitch;
			}
		}
	} else if (data.direction ==="right") {
		if (diffRad(data.zeroYaw, data.orientation.yaw) > 0.3) {
			if (diffRad (data.zeroYaw, data.orientation.yaw) < 0.95 * diffRad(data.zeroYaw, data.maxZ)) {
				data.volume = volumizer (data.volume, diffRad(data.zeroYaw, data.maxZ));
				right();
				data.maxZ = data.zeroYaw;
			}
		}
	} else if (data.direction ==="left"){
		if (diffRad(data.zeroYaw, data.orientation.yaw) < 6.2 && diffRad (data.zeroYaw, data.orientation.yaw) > Math.PI){
			if (diffRad (data.zeroYaw, data.orientation.yaw) > 1.05 * diffRad (data.zeroYaw, data.minZ)) {
				data.volume = volumizer (data.volume, 2*Math.PI - diffRad(data.zeroYaw, data.minZ));
				left();
				data.minZ = data.zeroYaw;
			}
		}
	} else if (data.direction ==="up") {
		if (diffRad(data.zeroPitch, data.orientation.pitch) > 0.3){
			if (diffRad (data.zeroPitch, data.orientation.pitch) < 0.95 * diffRad(data.zeroPitch, data.maxY)) {
				data.volume = volumizer (data.volume, diffRad(data.zeroPitch, data.maxY));
				up();
				data.maxY = data.zeroPitch;
			}
		}
	}
}

function volumizer(oldv, diff) {
	return Math.pow((3 * oldv + diff) / 4, 1);
}

/*document.body.onload = function(){
	//var fn =function(){loopVideos("changeSpeed")};
	//setInterval(fn,20);
	console.log("weeeeeee");

	setInterval(loop, 10);


}*/

//setInterval(loop, 10);
setTimeout(function() {
	console.log("Interval set.");
	setInterval(loop, 10);
}, 5000);
/*
$(window).load(function(){
	//var fn =function(){loopVideos("changeSpeed")};
	//setInterval(fn,20);
	//setTimeout(function (){
		console.log("weeeeeee");

		setInterval(loop, 10);
		//}, 4000);
});*/
