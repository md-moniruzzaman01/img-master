import cv2, numpy as np, potrace, sys, json, os
# args: inkdir outjson H frames...
d,out,H=sys.argv[1],sys.argv[2],int(sys.argv[3]); ids=[int(x) for x in sys.argv[4:]]
ms=[255-cv2.imread(f"{d}/{i:03d}.png",0) for i in ids]
u=np.zeros_like(ms[0])
for m in ms: u|=m
ys,xs=np.where(u>0); x0,x1,y0,y1=xs.min(),xs.max(),ys.min(),ys.max()
pad=6; x0=max(0,x0-pad); y0=max(0,y0-pad); x1+=pad; y1+=pad
s=H/(y1-y0); W=int((x1-x0)*s)
paths=[]
for m in ms:
    c=cv2.resize(m[y0:y1,x0:x1],(W,H),interpolation=cv2.INTER_AREA)
    c=cv2.GaussianBlur(c,(3,3),0)>127
    bm=potrace.Bitmap(~c); pl=bm.trace(turdsize=6,alphamax=1.1,opticurve=True,opttolerance=0.4)
    dd=[]
    for cv in pl:
        sp=cv.start_point; seg=[f"M{sp.x:.1f} {sp.y:.1f}"]
        for g in cv.segments:
            if g.is_corner: seg.append(f"L{g.c.x:.1f} {g.c.y:.1f}L{g.end_point.x:.1f} {g.end_point.y:.1f}")
            else: seg.append(f"C{g.c1.x:.1f} {g.c1.y:.1f} {g.c2.x:.1f} {g.c2.y:.1f} {g.end_point.x:.1f} {g.end_point.y:.1f}")
        dd.append("".join(seg)+"Z")
    paths.append("".join(dd))
json.dump({"w":W,"h":H,"paths":paths},open(out,"w"))
print(out,W,H,sum(len(p) for p in paths)//len(paths),'avg chars/frame')
