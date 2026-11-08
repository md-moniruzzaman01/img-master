import cv2, numpy as np, glob, os, sys
mode=sys.argv[1]; d=sys.argv[2]; out=sys.argv[3]
os.makedirs(out,exist_ok=True)
for f in sorted(glob.glob(d+'/*.png')):
    img=cv2.imread(f); m=cv2.imread(d+'_m/'+os.path.basename(f),0)
    m=(m>110).astype(np.uint8)*255
    if mode=='kendo':
        hsv=cv2.cvtColor(img,cv2.COLOR_BGR2HSV)
        wood=cv2.inRange(hsv,(5,60,70),(30,255,255))
        # keep wood only near person
        near=cv2.dilate(m,np.ones((120,120),np.uint8))
        wood=cv2.bitwise_and(wood,near)
        wood=cv2.morphologyEx(wood,cv2.MORPH_CLOSE,np.ones((9,9),np.uint8))
        m=cv2.bitwise_or(m,wood)
    if mode=='back':
        hsv=cv2.cvtColor(img,cv2.COLOR_BGR2HSV)
        dark=cv2.inRange(hsv,(0,0,0),(180,255,70))
        near=cv2.dilate(m,np.ones((40,40),np.uint8))
        m=cv2.bitwise_or(m,cv2.bitwise_and(dark,near))
    m=cv2.morphologyEx(m,cv2.MORPH_OPEN,np.ones((3,3),np.uint8))
    n,lab,st,_=cv2.connectedComponentsWithStats(m)
    if n>1:
        big=1+np.argmax(st[1:,cv2.CC_STAT_AREA]); keep=np.zeros_like(m)
        for i in range(1,n):
            if st[i,cv2.CC_STAT_AREA]>st[big,cv2.CC_STAT_AREA]*0.02: keep[lab==i]=255
        m=keep
    cv2.imwrite(out+'/'+os.path.basename(f),255-m)
print('ok')
