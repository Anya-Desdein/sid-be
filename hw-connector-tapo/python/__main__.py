import json # https://stackoverflow.com/questions/3229419/how-to-pretty-print-nested-dictionaries
import sys 
from base64 import b64decode # https://docs.python.org/3/library/base64.html#base64.b64decode
from PyP100 import PyP100 # Used library: https://github.com/fishbigger/TapoP100

# stdin https://docs.python.org/3/library/io.html#io.IOBase.readline
jsonString = sys.stdin.readline()
params = json.loads(jsonString)

def error(text):
  print(json.dumps({"error": text}), file=sys.stdout)
  sys.exit(1)

# backslash to break the line without the interpreter noticing
if 'address' not in params or \
   'username' not in params or \
   'password' not in params:
  error("address, username and password are required parameters")

# Smart plug LAN address
address = params['address']
# Tapo App Credentials
username = params['username']
# password has some limitations in order to work
# https://github.com/fishbigger/TapoP100/issues/1
password = params['password']

# optional command parsing
command = None
if 'command' in params:
  command = params['command']
  if command is False:
    command = None

# Creating a Tapo P100 plug object from library
plug = PyP100.P100(address, username, password)

# Log in
plug.handshake() #Creates the cookies required for further methods
plug.login() #Sends credentials to the plug and creates AES Key and IV for further methods

# Commands
if command == "on":
  plug.turnOn()
elif command == "off":
  plug.turnOff()
elif command is None:
  pass
else:
  error("Unknown command")


# Fetch and return status
plugInfo = plug.getDeviceInfo()['result'] #Returns dict with all the device info

info = {
  "name": b64decode(plugInfo['nickname']).decode("utf-8"),
  "ssid": b64decode(plugInfo['ssid']).decode("utf-8"),
  "mac": plugInfo['mac'],
  "ip": plugInfo['ip'],
  "device_on": plugInfo['device_on'],
  "device_id": plugInfo['device_id'],
  "fault": plugInfo['overheated'],
}

print(json.dumps(info, sort_keys=True)) # Return as json over stdout to be read by javascript
