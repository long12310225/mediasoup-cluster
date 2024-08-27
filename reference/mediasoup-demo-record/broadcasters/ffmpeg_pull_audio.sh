#!/usr/bin/env bash

SERVER_URL=https://10.2.30.20:4443
ROOM_ID=0000
PRODUCER_ID=ffc889ea-4788-485c-aa55-fe52052b607d
function show_usage()
{
 echo
 echo "USAGE"
 echo "-----"
 echo
 echo "  SERVER_URL=https://my.mediasoup-demo.org:4443 ROOM_ID=test  ./ffmpeg.sh"
 echo
 echo "  where:"
 echo "  - SERVER_URL is the URL of the mediasoup-demo API server"
 echo "  - ROOM_ID is the id of the mediasoup-demo room (it must exist in advance)"
 echo "  - MEDIA_FILE is the path to a audio+video file (such as a .mp4 file)"
 echo
 echo "REQUIREMENTS"
 echo "------------"
 echo
 echo "  - ffmpeg: stream audio and video (https://www.ffmpeg.org)"
 echo "  - httpiei: command line HTTP client (https://httpie.org)"
 echo "  - jq: command-line JSON processor (https://stedolan.github.io/jq)"
 echo
}

echo

if [ -z "${SERVER_URL}" ] ; then
 >&2 echo "ERROR: missing SERVER_URL environment variable"
 show_usage
 exit 1
fi

if [ -z "${ROOM_ID}" ] ; then
 >&2 echo "ERROR: missing ROOM_ID environment variable"
 show_usage
 exit 1
fi


if [ "$(command -v ffmpeg)" == "" ] ; then
 >&2 echo "ERROR: ffmpeg command not found, must install FFmpeg"
 show_usage
 exit 1
fi

if [ "$(command -v http)" == "" ] ; then
 >&2 echo "ERROR: http command not found, must install httpie"
 show_usage
 exit 1
fi

if [ "$(command -v jq)" == "" ] ; then
 >&2 echo "ERROR: jq command not found, must install jq"
 show_usage
 exit 1
fi

set -e

BROADCASTER_ID=$(LC_CTYPE=C tr -dc A-Za-z0-9 < /dev/urandom | fold -w ${1:-32} | head -n 1)
HTTPIE_COMMAND="http --check-status --verify=no"
AUDIO_SSRC=2614530593
AUDIO_PT=111
# VIDEO_SSRC=3838163518
# VIDEO_PT=101

#
# Verify that a room with id ROOM_ID does exist by sending a simlpe HTTP GET. If
# not abort since we are not allowed to initiate a room..
#
echo ">>> verifying that room '${ROOM_ID}' exists..."

${HTTPIE_COMMAND} \
 GET ${SERVER_URL}/rooms/${ROOM_ID} > /dev/null

#
# Create a Broadcaster entity in the server by sending a POST with our metadata.
# Note that this is not related to mediasoup at all, but will become just a JS
# object in the Node.js application to hold our metadata and mediasoup Transports
# and Producers.
#
echo ">>> creating Puller..."

${HTTPIE_COMMAND} \
 POST ${SERVER_URL}/rooms/${ROOM_ID}/broadcasters \
 id="${BROADCASTER_ID}" \
 displayName="Puller" \
 device:='{"name": "FFmpeg"}' \
 rtpCapabilities:="{ \"codecs\": [{ \"mimeType\":\"audio/opus\", \"payloadType\":${AUDIO_PT}, \"clockRate\":48000, \"channels\":2, \"parameters\":{ \"sprop-stereo\":1 } }]}"  \
 > /dev/null

#
# Upon script termination delete the Broadcaster in the server by sending a
# HTTP DELETE.
#
trap 'echo ">>> script exited with status code $?"; ${HTTPIE_COMMAND} DELETE ${SERVER_URL}/rooms/${ROOM_ID}/broadcasters/${BROADCASTER_ID} > /dev/null' EXIT

#
# Create a PlainTransport in the mediasoup to send our audio using plain RTP
# over UDP. Do it via HTTP post specifying type:"plain" and comedia:true and
# rtcpMux:false.
#
echo ">>> creating mediasoup PlainTransport for consumer audio..."

res=$(${HTTPIE_COMMAND} \
 POST ${SERVER_URL}/rooms/${ROOM_ID}/broadcasters/${BROADCASTER_ID}/transports \
 type="plain" \
 comedia:=false \
 rtcpMux:=false \
 2> /dev/null)

#
# Parse JSON response into Shell variables and extract the PlainTransport id,
# IP, port and RTCP port.
#
eval "$(echo ${res} | jq -r '@sh "audioTransportId=\(.id) audioTransportIp=\(.ip) audioTransportPort=\(.port) audioTransportRtcpPort=\(.rtcpPort)"')"

echo ${res}
#
# Create a mediasoup Producer to send audio by sending our RTP parameters via a
# HTTP POST.
#

echo ">>>PlainTransport Connect"

${HTTPIE_COMMAND} -v \
 POST ${SERVER_URL}/rooms/${ROOM_ID}/broadcasters/${BROADCASTER_ID}/transports/${audioTransportId}/plainconnect \
 ip="10.2.30.20" \
 port:=33334 \
 rtcpport:=33335 \
 > /dev/null

#echo ${res}


echo ">>> creating mediasoup audio consumer..."

res1=$(${HTTPIE_COMMAND} \
 POST ${SERVER_URL}/rooms/${ROOM_ID}/broadcasters/${BROADCASTER_ID}/transports/${audioTransportId}/consume?producerId=${PRODUCER_ID} \
  2> /dev/null)



echo "creat consumer res :"
echo ${res1}
eval "$(echo ${res1} | jq -r '@sh "consumeId=\(.id)"')"

echo ">>>>resume"
echo ${consumeId}

${HTTPIE_COMMAND} -v \
 POST ${SERVER_URL}/rooms/${ROOM_ID}/broadcasters/${BROADCASTER_ID}/consume/${consumeId}/resume \
  > /dev/null



#
echo ">>> running ffmpeg..."

ffmpeg -reorder_queue_size 16384 -protocol_whitelist file,udp,rtp -i a.sdp -acodec aac -y output.aac

#ffmpeg -reorder_queue_size 16384 -protocol_whitelist "file,udp,rtp" -i a.sdp -acodec copy -f flv rtmp://your_rtmp_server_url/live/stream_key