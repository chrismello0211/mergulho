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
print('Lembrete: suba o VERSAO no sw.js antes de publicar.')
