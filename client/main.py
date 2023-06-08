#
# Client-side python app for photoapp, this time working with
# web service, which in turn uses AWS S3 and RDS to implement
# a simple photo application for photo storage and viewing.
#
# Project 02 for CS 310, Spring 2023.
#
# Authors:
#   Jiayan Luo
#   Northwestern University
#   Spring 2023
#

import requests  # calling web service
import jsons  # relational-object mapping

import uuid
import pathlib
import logging
import sys
import os
import base64

from configparser import ConfigParser

import matplotlib.pyplot as plt
import matplotlib.image as img


###################################################################
#
# classes
#
class User:
    userid: int  # these must match columns from DB table
    email: str
    lastname: str
    firstname: str
    bucketfolder: str


class Asset:
    assetid: int  # these must match columns from DB table
    userid: int
    assetname: str
    bucketkey: str


class BucketItem:
    Key: str  # these must match columns from DB table
    LastModified: str
    ETag: str
    Size: int
    StorageClass: str


###################################################################
#
# prompt
#
def prompt():
    """
    Prompts the user and returns the command number

    Parameters
    ----------
    None

    Returns
    -------
    Command number entered by user (0, 1, 2, ...)
    """
    print()
    print(">> Enter a command:")
    print("   0 => end")
    print("   1 => stats")
    print("   2 => users")
    print("   3 => assets")
    print("   4 => download")
    print("   5 => download and display")
    print("   6 => bucket contents")
    print("   7 => upload an image")

    cmd = int(input())
    return cmd


###################################################################
#
# stats
#
def stats(baseurl):
    """
    Prints out S3 and RDS info: bucket status, # of users and
    assets in the database

    Parameters
    ----------
    baseurl: baseurl for web service

    Returns
    -------
    nothing
    """

    try:
        #
        # call the web service:
        #
        api = "/stats"
        url = baseurl + api

        res = requests.get(url)
        print(res)
        #
        # let's look at what we got back:
        #
        if res.status_code != 200:
            # failed:
            print("Failed with status code:", res.status_code)
            print("url: " + url)
            if res.status_code == 400:  # we'll have an error message
                body = res.json()
                print("Error message:", body["message"])
            #
            return

        #
        # deserialize and extract stats:
        #
        body = res.json()
        #
        print("bucket status:", body["message"])
        print("# of users:", body["db_numUsers"])
        print("# of assets:", body["db_numAssets"])

    except Exception as e:
        logging.error("stats() failed:")
        logging.error("url: " + url)
        logging.error(e)
        return


###################################################################
#
# users
#
def users(baseurl):
    """
    Prints out all the users in the database

    Parameters
    ----------
    baseurl: baseurl for web service

    Returns
    -------
    nothing
    """

    try:
        #
        # call the web service:
        #
        api = "/users"
        url = baseurl + api

        res = requests.get(url)

        #
        # let's look at what we got back:
        #
        if res.status_code != 200:
            # failed:
            print("Failed with status code:", res.status_code)
            print("url: " + url)
            if res.status_code == 400:  # we'll have an error message
                body = res.json()
                print("Error message:", body["message"])
            #
            return

        #
        # deserialize and extract users:
        #
        body = res.json()
        #
        # let's map each dictionary into a User object:
        #
        users = []
        for row in body["data"]:
            user = jsons.load(row, User)
            users.append(user)
        #
        # Now we can think OOP:
        #
        for user in users:
            print(user.userid)
            print(" ", user.email)
            print(" ", user.lastname, ",", user.firstname)
            print(" ", user.bucketfolder)

    except Exception as e:
        logging.error("users() failed:")
        logging.error("url: " + url)
        logging.error(e)
        return


def assets(baseurl):
    """
    Prints out all the assets in the database

    Parameters
    ----------
    baseurl: baseurl for web service

    Returns
    -------
    nothing
    """

    try:
        #
        # call the web service:
        #
        api = "/assets"
        url = baseurl + api

        res = requests.get(url)

        #
        # let's look at what we got back:
        #
        if res.status_code != 200:
            # failed:
            print("Failed with status code:", res.status_code)
            print("url: " + url)
            if res.status_code == 400:  # we'll have an error message
                body = res.json()
                print("Error message:", body["message"])
            #
            return

        #
        # deserialize and extract users:
        #
        body = res.json()
        #
        # let's map each dictionary into a User object:
        #
        assets = []
        for row in body["data"]:
            asset = jsons.load(row, Asset)
            assets.append(asset)
        #
        # Now we can think OOP:
        #
        for asset in assets:
            print(asset.assetid)
            print(" ", asset.userid)
            print(" ", asset.assetname)
            print(" ", asset.bucketkey)

    except Exception as e:
        logging.error("assets() failed:")
        logging.error("url: " + url)
        logging.error(e)
        return


def download(baseurl, assetid, display=False):
    """
    Downloads asset from asset id

    Parameters
    ----------
    baseurl: baseurl for web service
    assetid: id for asset
    display: whether or not to display image

    Returns
    -------
    file: binary file with asset name in the response
    """
    try:
        #
        # call the web service:
        #
        api = "/download"
        assetid = "/" + assetid
        url = baseurl + api + assetid

        res = requests.get(url)

        #
        # let's look at what we got back (return response will be 200):
        #
        body = res.json()
        if body["message"] != "success":
            print(body["message"])
            return

        #
        # download file
        #
        data = base64.b64decode(body["data"])
        assetname = body["asset_name"]
        outfile = open(assetname, "wb")
        outfile.write(data)

        #
        # return file information
        #
        print("userid: ", body["user_id"])
        print("asset name: ", assetname)
        print("bucket key: ", body["bucket_key"])
        print(f"Downloaded from S3 and saved as ' {assetname} '")
        if display:
            image = img.imread(assetname)
            plt.imshow(image)
            plt.show()

    except Exception as e:
        logging.error("download() failed:")
        logging.error("url: " + url)
        logging.error(e)
        return
    return


def bucket(baseurl, startafter=""):
    """
    List bucket information in pages of size 12

    Parameters
    ----------
    baseurl: baseurl for web service
    assetid: id for asset
    display: whether or not to display image

    Returns
    -------
    file: binary file with asset name in the response
    """

    try:
        #
        # call the web service:
        #
        api = "/bucket"
        url = baseurl + api + startafter

        res = requests.get(url)

        #
        # let's look at what we got back:
        #
        if res.status_code != 200:
            # failed:
            print("Failed with status code:", res.status_code)
            print("url: " + url)
            if res.status_code == 400:  # we'll have an error message
                body = res.json()
                print("Error message:", body["message"])
            #
            return

        #
        # deserialize and extract users:
        #
        body = res.json()

        # let's map each dictionary into a User object:
        #
        bucketitems = []
        for row in body["data"]:
            bucketitem = jsons.load(row, BucketItem)
            bucketitems.append(bucketitem)

        #
        # Special Case: 0 Assets
        #
        if not bucketitems:
            return
        #
        # Now we can think OOP:
        #
        for bucketitem in bucketitems:
            print(bucketitem.Key)
            print(" ", bucketitem.LastModified)
            print(" ", bucketitem.Size)

        #
        # Ask about next page
        print("another page? [y/n]")
        cmd = input()
        lastitem = bucketitems[-1].Key
        if cmd == "y":
            bucket(baseurl, "/?startafter=" + lastitem)

    except Exception as e:
        logging.error("assets() failed:")
        logging.error("url: " + url)
        logging.error(e)
        return

def image(baseurl, userid, filename):
    """
    Uploads file to userid

    Parameters
    ----------
    baseurl: baseurl for web service
    user: userid to post to
    filename: filename to upload

    Returns
    -------
    file: binary file with asset name in the response
    """

    try:
        #
        # call the web service:
        #
        api = "/image/" + userid
        url = baseurl + api

        # find base64 encoding
        with open(filename, 'rb') as image_file:
            binary_file = image_file.read()
            encoded_file = base64.b64encode(binary_file)
            string_file = encoded_file.decode()
        
        data = {
            "assetname": filename,
            "data": string_file,
        }

        res = requests.post(url, json=data)

        #
        # let's look at what we got back:
        #
        if res.status_code != 200:
            # failed:
            print("Failed with status code:", res.status_code)
            print("url: " + url)
            if res.status_code == 400:  # we'll have an error message
                body = res.json()
                print("Error message:", body["message"])
            #
            return
        
    except Exception as e:
        logging.error("upload() failed:")
        logging.error("url: " + url)
        logging.error(e)
        return


#########################################################################
# main
#
print("** Welcome to PhotoApp v2 **")
print()

# eliminate traceback so we just get error message:
sys.tracebacklimit = 0

#
# what config file should we use for this session?
#
config_file = "photoapp-client-config"

print("What config file to use for this session?")
print("Press ENTER to use default (photoapp-config),")
print("otherwise enter name of config file>")
s = input()

if s == "":  # use default
    pass  # already set
else:
    config_file = s

#
# does config file exist?
#
if not pathlib.Path(config_file).is_file():
    print("**ERROR: config file '", config_file, "' does not exist, exiting")
    sys.exit(0)

#
# setup base URL to web service:
#
configur = ConfigParser()
configur.read(config_file)
baseurl = configur.get("client", "webservice")

# print(baseurl)

#
# main processing loop:
#
cmd = prompt()

while cmd != 0:
    #
    if cmd == 1:
        stats(baseurl)
    elif cmd == 2:
        users(baseurl)
    elif cmd == 3:
        assets(baseurl)
    elif cmd == 4 or cmd == 5:
        print("Enter asset id>")
        assetid = input()
        display = True if cmd == 5 else False
        download(baseurl, assetid, display)
    elif cmd == 6:
        bucket(baseurl)
    elif cmd == 7:
        print("Enter userid>")
        userid = input()
        print("Enter filename>")
        filename = input()
        image(baseurl, userid, filename)
    else:
        print("** Unknown command, try again...")
    #
    cmd = prompt()

#
# done
#
print()
print("** done **")
