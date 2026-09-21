# Roda o bot de calibragem nas 30 fases e imprime jogadas, taxa de sucesso e marcas.
# Precisa do Node instalado.  Uso:  python calibrar.py        (todas as fases)
#                                   python calibrar.py 2      (só o mundo 2)
#                                   python calibrar.py x fixo (mede sem mexer nas jogadas)
import io, os, sys, subprocess, tempfile
AQUI = os.path.dirname(os.path.abspath(__file__))
js = '\n'.join(io.open(os.path.join(AQUI, f), encoding='utf-8').read() for f in ['m1.js', 'js2.js', 'calib.js'])
tmp = os.path.join(tempfile.gettempdir(), 'mergulho-calib.js')
io.open(tmp, 'w', encoding='utf-8').write(js)
subprocess.run(['node', tmp] + sys.argv[1:])
