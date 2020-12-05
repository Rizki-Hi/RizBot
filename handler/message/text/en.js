exports.textMenu = (pushname) => {
    return `
Hi, ${pushname || ''}! 👋️
Here are some of the features of this bot! ✨

Sticker Maker:
𐃘 *#sticker*
To convert an image into a sticker, send the image with the caption #sticker or reply to the image that has been sent with #sticker.

𐃘 *#stickers* _<Image Url>_
To change the image from the url to a sticker.

𐃘 *#gifsticker* _<Giphy URL>_ / *#stickergif* _<Giphy URL>_
To turn a gif into a sticker (Giphy only)

Downloader:
𐃘 *#tiktok* _<post / video url>_
Will return video tiktok.

𐃘 *#fb* _<post / video url>_
Will return the Facebook video download link.

𐃘 *#ig* _<post / video url>_
Will return the Instagram video download link.

𐃘 *#twt* _<post / video url>_
Will return the Twitter video download link.

Etc:
𐃘 *#tnc*
Displays Bot Terms and Conditions.

Hope you have a great day!✨`
}

exports.textAdmin = () => {
    return `
⚠ [ *Admin Group Only* ] ⚠ 
Here are some of the group admin features included in this bot!

𐃘 *#kick* @user
Removing members from the group (can be more than 1).

𐃘 *#promote* @user
Promote members to group admins.

𐃘 *#demote* @user
Demote Group admins.

𐃘 *#tagall*
Mention of all group members.`
}
