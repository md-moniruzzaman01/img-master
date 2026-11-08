import os, sys, glob
os.environ['NUMBA_DISABLE_JIT']='1'
from rembg import remove, new_session
s=new_session('u2net_human_seg')
for d in sys.argv[1:]:
    os.makedirs(d+'_m',exist_ok=True)
    for f in sorted(glob.glob(d+'/*.png')):
        from PIL import Image
        m=remove(Image.open(f),session=s,only_mask=True)
        m.save(d+'_m/'+os.path.basename(f))
    print(d,'done')
