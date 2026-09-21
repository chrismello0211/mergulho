# Monta o index.html (arquivo único) a partir das partes desta pasta.
# Uso, de dentro da pasta fonte:   python montar.py
import io, os
AQUI = os.path.dirname(os.path.abspath(__file__))
ler = lambda n: io.open(os.path.join(AQUI, n), encoding='utf-8').read()
js = '\n'.join(ler(f) for f in ['m1.js', 'pecas.js', 'cena.js', 'js2.js', 'm3.js', 'm4.js'])
cab = ler('cabeca.html').replace('<title>Mergulho</title>', '<title>Mergulho</title>\n' + ler('pwa-cabeca.html'), 1)
html = cab.replace('<body>\n</body>',
                   '<body>\n' + ler('corpo.html') + '\n<script>\n' + js + '\n</script>\n' + ler('pwa-registro.html') + '</body>', 1)
destino = os.path.join(AQUI, '..', 'index.html')
io.open(destino, 'w', encoding='utf-8', newline='\n').write(html)
print('index.html montado:', len(html.encode('utf-8')), 'bytes')
import re
ver = re.search(r"VERSAO_JOGO = '([^']+)'", ler('m1.js')).group(1)
swp = os.path.join(AQUI, '..', 'sw.js')
sw = io.open(swp, encoding='utf-8').read()
sw = re.sub(r"const VERSAO = '[^']+';", "const VERSAO = 'v" + ver + "';", sw)
io.open(swp, 'w', encoding='utf-8', newline='\n').write(sw)
print('sw.js apontando para v' + ver + ' (a versão vem do VERSAO_JOGO no m1.js)')
