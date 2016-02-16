#! /bin/bash 

# kill node server if any
killall node

# launch node tuio server 
cd ~/Code/node/eyetunes/ && node server.js 

# launch Chrome
/usr/bin/open -a "/Applications/Google Chrome.app" 

# kill CCV
pkill Community*

# launch CCV
/usr/bin/open -a "/Applications/CCV/Community Core Vision.app" 
