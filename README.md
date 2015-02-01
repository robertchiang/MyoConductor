#MyoConductor (Made for UofTHacks)

###Made by: Robert Chiang, Tony Wang, Kye Wei

MyoConductor is a Chrome extension that allows a user to use the Myo gesture armband to control the tempo and dynamics of HTML5 videos through typical conducting gestures. This includes videos hosted on popular sites like Youtube.


##Features
- Initial calibration to match tempo of song
- Increasing/Decreasing Volume
- Speeding up/Slowing Down video
- Pause/Play video
- Support for conducting in 4/4 time

##Technologies
- Chrome Extension API
- Myo SDK through the browser with [currently beta](https://developer.thalmic.com/forums/topic/534/) WebSockets and JavaScript bindings

##Myo Gesture/Movement Mapping
- **Wave-In:** Calibrates orientation, resets speed and prepares controller for initial use
- **Wave-Out:** Resets speed to default
- **Fist:** Holds/pauses media
- **Rest:** Resumes playing media
- **Speed of Arm Movement:** Lets user keep control of the beat, speed up or slow down tempo
- **Magnitude of Arm Movement:** Sound level, dynamics
