#!/usr/bin/env bash
source ./common.sh

SERVER_URL=https://10.2.110.222:4443
ROOM_ID=0000
MEDIA_FILE=./output.webm
BROADCASTER_ID=$(LC_CTYPE=C tr -dc A-Za-z0-9 < /dev/urandom | fold -w ${1:-32} | head -n 1)
HTTPIE_COMMAND="http --check-status --verify=no"
PRODUCER_ID=60cadbff-7dca-46e7-984c-60c949318876
VIDEO_SSRC=4039824658
VIDEO_PT=96
#AUDIO_SSRC=4253847681
#AUDIO_PT=111

function show_usage()
{
	echo
	echo "USAGE"
	echo "-----"
	echo
	echo "  SERVER_URL=https://my.mediasoup-demo.org:4443 ROOM_ID=test"
	echo
	echo "  where:"
	echo "  - SERVER_URL is the URL of the mediasoup-demo API server"
	echo "  - ROOM_ID is the id of the mediasoup-demo room (it must exist in advance)"
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

res2=$(${HTTPIE_COMMAND} \
	POST ${SERVER_URL}/rooms/${ROOM_ID}/broadcasters \
	id="${BROADCASTER_ID}" \
	displayName="Pullerv" \
	device:='{"name": "pullv"}' \
	rtpCapabilities:="{ \"codecs\": [{ \"mimeType\":\"video/vp8\", \"payloadType\":${VIDEO_PT}, \"clockRate\":90000  }], \"encodings\": [{ \"ssrc\":${VIDEO_SSRC}  }]  }"   \
	2>&1)

# 打印请求后的结果到控制台
echo "接口2 /rooms/:roomId/broadcasters res ==> ${tty_green} $res2 ${tty_reset}"

#
# Upon script termination delete the Broadcaster in the server by sending a
# HTTP DELETE.
#
trap 'echo ">>> script exited with status code $?"; ${HTTPIE_COMMAND} DELETE ${SERVER_URL}/rooms/${ROOM_ID}/broadcasters/${BROADCASTER_ID} > /dev/null' EXIT

#
# Create a PlainTransport in the mediasoup to pull  video using plain RTP
# over UDP. Do it via HTTP post specifying type:"plain" and comedia:false and
# rtcpMux:false.
#
echo ">>> creating mediasoup PlainTransport for consumer video..."

res3=$(${HTTPIE_COMMAND} \
	POST ${SERVER_URL}/rooms/${ROOM_ID}/broadcasters/${BROADCASTER_ID}/transports \
	type="plain" \
	comedia:=false \
	rtcpMux:=false \
	2> /dev/null)

#
# Parse JSON response into Shell variables and extract the PlainTransport id,
# IP, port and RTCP port.
#
eval "$(echo ${res3} | jq -r '@sh "transportId=\(.id) transportIp=\(.ip) transportPort=\(.port) transportRtcpPort=\(.rtcpPort)"')"

echo "接口3 /rooms/:roomId/broadcasters/:broadcasterId/transports res ==> ${tty_green} ${res3} ${tty_reset}"


echo ">>> PlainTransport Connect ..."

res4=$(${HTTPIE_COMMAND} \
	POST ${SERVER_URL}/rooms/${ROOM_ID}/broadcasters/${BROADCASTER_ID}/transports/${transportId}/plainconnect \
	ip="127.0.0.1" \
	port:=33334 \
	rtcpport:=33335 \
	> /dev/null)

echo "接口4 /rooms/:roomId/broadcasters/:broadcasterId/transports/:transportId/plainconnect === none"

echo ">>> creating mediasoup video consumer..."

res5=$(${HTTPIE_COMMAND} \
	POST ${SERVER_URL}/rooms/${ROOM_ID}/broadcasters/${BROADCASTER_ID}/transports/${transportId}/consume?producerId=${PRODUCER_ID} \
		2> /dev/null)
		
echo "接口5 /rooms/:roomId/broadcasters/:broadcasterId/transports/:transportId/consume res ==> ${tty_green} ${res5} ${tty_reset}"

eval "$(echo ${res5} | jq -r '@sh "consumeId=\(.id)"')"

echo ">>> resume ..."

res6=$(${HTTPIE_COMMAND} \
	POST ${SERVER_URL}/rooms/${ROOM_ID}/broadcasters/${BROADCASTER_ID}/consume/${consumeId}/resume \
		> /dev/null)

echo "接口6 /rooms/:roomId/broadcasters/:broadcasterId/consume/:consumeId/resume res == {} ==> ${tty_green} ${res6} ${tty_reset}"

echo "http接口执行完成"

echo "等待5秒后, 开始执行拉流"

sleep 5

echo ">>> running ffmpeg..."

ffmpeg -thread_queue_size 10240  -protocol_whitelist "file,udp,rtp" -i v.sdp -vcodec copy -y ${MEDIA_FILE}

#ffmpeg -thread_queue_size 10240  -protocol_whitelist "file,udp,rtp"  -i v.sdp -c:v libx264 -preset slow -crf 23 -c:a aac -b:a 128k -f flv rtmp://10.2.30.27/live/stream_key


#ffmpeg -thread_queue_size 10240 -protocol_whitelist "file,udp,rtp" -i v.sdp -c:v libx264 -preset fast -crf 28 -bf 0 -g 60 -c:a aac -b:a 128k -threads auto -f flv rtmp://10.2.30.27/live/stream_key


# ffmpeg \
# -i "rtmp://video_rtmp_server_url/live/video_stream_key" \
# -i "rtmp://audio_rtmp_server_url/live/audio_stream_key" \
# -copyts \
# -map 0:v -map 1:a \
# -async 1 \
# -vsync 1 \
# -f flv \
# rtmp://combined_rtmp_server_url/live/mixed_stream_key

# ffmpeg \
# -i "rtmp://video_rtmp_server_url/live/video_stream_key" \
# -i "rtmp://audio_rtmp_server_url/live/audio_stream_key" \
# -filter_complex "[0:v]setpts=PTS+VSYNC_DELAY/TB[v];[1:a]adelay=VSYNC_DELAY*1000|VSYNC_DELAY*1000[a]" \
# -map "[v]" -map "[a]" \
# -c:v copy -c:a copy \
# -f flv \
# rtmp://combined_rtmp_server_url/live/mixed_stream_key