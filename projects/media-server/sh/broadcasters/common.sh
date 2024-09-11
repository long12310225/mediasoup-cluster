#!/bin/bash

###
 # @Author: 欧阳杏棠 example@abc.com
 # @Date: 2024-08-21 16:10:36
 # @LastEditors: 欧阳杏棠 example@abc.com
 # @LastEditTime: 2024-08-21 16:10:57
###

# 渲染控制台
if [[ -t 1 ]]; then
  tty_escape() { printf "\033[%sm" "$1"; }
else
  tty_escape() { :; }
fi
tty_universal() { tty_escape "0;$1"; }
tty_blue="$(tty_universal 34)" #蓝色
tty_red="$(tty_universal 31)" #红色
tty_green="$(tty_universal 32)" #绿色
tty_yellow="$(tty_universal 33)" #黄色
tty_cyan="$(tty_universal 36)" #青色
tty_reset="$(tty_escape 0)" #去除颜色
