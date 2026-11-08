import cv2, sys
src,outdir,start,end,step=sys.argv[1],sys.argv[2],float(sys.argv[3]),float(sys.argv[4]),int(sys.argv[5])
cap=cv2.VideoCapture(src); fps=cap.get(cv2.CAP_PROP_FPS)
i=int(start*fps); n=0
while i<=end*fps:
    cap.set(cv2.CAP_PROP_POS_FRAMES,i); ok,f=cap.read()
    if not ok: break
    cv2.imwrite(f"{outdir}/{n:03d}.png",f); n+=1; i+=step
print(n)
