import re, json, subprocess, os, sys
from playwright.sync_api import sync_playwright

D=dict(ux=0,p=179,inc=4,ex=20,gbInc=50,gb=0,gbx=0.036,disc=15,dom=3,srv=42,mail=112,sto=0.6,fx=5.6,pay='c30',feePix=0.99,feeC30=3.99,feeC14=4.48,feeC0=4.98,feeBol=3.99,iss=2,pis=0.65,cofins=3,coop=0)
def model(o):
    s={**D,**o}
    gbCost=s['sto']*s['fx']/s['gbInc']; gbPrice=round(s['gbx']*s['fx']*100)/100
    list_=s['p']+s['ux']*s['ex']+s['gb']*gbPrice
    ann=round(list_*(1-min(s['disc'],100)/100)*100)/100
    sto=s['sto']*s['fx']+s['gb']*gbCost
    key={'c30':'feeC30','c14':'feeC14','c0':'feeC0','pix':'feePix','bol':'feeBol'}[s['pay']]
    def prof(price,annual=False):
        fee = (s['feeBol']/12 if annual else s['feeBol']) if s['pay']=='bol' else price*s[key]/100
        return price-sto-fee-price*(s['iss']+s['pis']+s['cofins'])/100-price*s['coop']/100-(s['dom']+s['srv']+s['mail'])
    return list_, ann, prof(list_), prof(list_)/list_ if list_ else 0

def num(t):
    neg = '-' in t.split('R$')[0] or t.strip().startswith('-')
    t = t.replace('R$','').replace('-','').replace('.','').replace(',','.').strip()
    v = float(re.findall(r'\d+(?:\.\d+)?', t)[0])
    return -v if neg else v

fails=[]; passes=0
def check(name,got,exp,tol=0.011):
    global passes
    if abs(got-exp)<=tol: passes+=1
    else: fails.append(f'{name}: got {got} expected {exp}')

def read(pg):
    pg.wait_for_timeout(60)
    det=pg.locator('.details-body').inner_text()
    price=num(pg.locator('.price-card, .pricecard, [class*=price]').first.inner_text().split('MENSALIDADE')[-1]) if False else None
    m=re.search(r'Lucro do escritório\s*\n?\s*(-?R\$\s*[\d.,]+)\s*·\s*(-?[\d.,]+)%',det.replace('−','-'))
    lucro=num(m.group(1)); marg=float(m.group(2).replace(',','.'))
    body=pg.inner_text('body').replace('−','-')
    body=body.replace('\u2212','-')
    mm=re.search(r'Mensal\s*\n\s*(R\$\s*[\d.,]+)',body); an=re.search(r'Anual · -?[\d.,]+%\s*\n\s*(R\$\s*[\d.,]+)',body)
    return lucro,marg,num(mm.group(1)),num(an.group(1)) if an else None,det

errs=[]
with sync_playwright() as p:
    b=p.chromium.launch(executable_path='/usr/bin/google-chrome',args=['--no-sandbox'])
    ctx=b.new_context(viewport={'width':1366,'height':900},accept_downloads=True)
    pg=ctx.new_page()
    pg.on('console',lambda m: errs.append(m.text) if m.type in('error','warning') else None)
    pg.on('pageerror',lambda e: errs.append(str(e)))
    pg.goto('http://localhost:4173/')
    pg.locator('summary:has-text("Detalhamento")').click()
    # open all param groups
    while pg.locator('aside details:not([open]) > summary').count(): pg.locator('aside details:not([open]) > summary').first.click()
    def setf(k,v):
        if k=='pay': pg.select_option('#pay',str(v))
        else: pg.fill(f'#{k}',str(v))
    def reset_all():
        pg.fill('#ux','0')
        for k,v in D.items():
            if k!='ux' and pg.locator(f'#{k}').count(): setf(k,v)
    scen=[{}]
    scen+= [{'ux':3},{'ux':0,'gb':10},{'gb':30},{'ux':5,'gb':120},
            {'p':250},{'inc':6},{'inc':6,'ux':2},{'ex':35,'ux':3},{'gbInc':100,'gb':10},{'gbx':0.05,'gb':40},
            {'disc':0},{'disc':30},{'dom':10},{'srv':60},{'mail':200},{'sto':1.2,'gb':20},{'fx':6.1,'gb':20},
            {'pay':'pix'},{'pay':'c14'},{'pay':'c0'},{'pay':'bol'},{'pay':'bol','ux':3,'gb':20},{'pay':'pix','feePix':1.5},{'feeC30':4.5},{'pay':'bol','feeBol':5},{'iss':5},{'pis':1},{'cofins':4},{'coop':10},{'coop':12.5,'ux':2,'gb':10,'disc':20}]
    for o in scen:
        reset_all()
        for k,v in o.items(): setf(k,v)
        L,A,Pf,Mg=model(o)
        lucro,marg,m,a,det=read(pg)
        check(f'{o} preço mensal',m,L)
        check(f'{o} preço anual',a,A)
        check(f'{o} lucro',lucro,Pf)
        check(f'{o} margem',marg,round(Mg*100,1),0.06)
        s={**D,**o}
        if s['ux']==0: 
            if 'Usuários extras' in det: fails.append(f'{o}: linha usuários extras indevida')
        else:
            if 'Usuários extras' not in det: fails.append(f'{o}: faltou linha usuários extras')
        if s['gb']==0 and 'Armazenamento extra' in det: fails.append(f'{o}: linha GB indevida')
        if s['gb']>0 and 'Armazenamento extra' not in det: fails.append(f'{o}: faltou linha GB')
        if s['coop']>0 and 'Cooperativa' not in det: fails.append(f'{o}: faltou linha coop')
        if s['coop']==0 and 'Cooperativa' in det: fails.append(f'{o}: linha coop indevida')
    # entradas inválidas
    reset_all()
    for bad in ['','-5','1e400']:
        pg.fill('#p',bad); pg.wait_for_timeout(80)
        t=pg.inner_text('body')
        if 'NaN' in t or 'Infinity' in t: fails.append(f'p={bad!r} gerou NaN/Infinity')
    reset_all(); pg.fill('#ux','-3'); pg.wait_for_timeout(80)
    if 'NaN' in pg.inner_text('body'): fails.append('ux negativo NaN')
    reset_all(); pg.fill('#disc','150'); pg.wait_for_timeout(80)
    if 'NaN' in pg.inner_text('body'): fails.append('disc=150 NaN')
    # steppers
    reset_all()
    pg.click('button[aria-label*="Aumentar"][aria-label*="suário"], #pu ~ button:last-of-type') if False else None
    btns=pg.locator('.stepper button')
    n=btns.count()
    if n>=4:
        btns.nth(1).click(); btns.nth(1).click()
        if pg.input_value('#ux')!='2': fails.append('stepper + usuários: '+pg.input_value('#ux'))
        btns.nth(0).click()
        if pg.input_value('#ux')!='1': fails.append('stepper − usuários')
        btns.nth(3).click()
        if pg.input_value('#gb')!='10': fails.append('stepper + GB: '+pg.input_value('#gb'))
        btns.nth(2).click()
        if not btns.nth(2).is_disabled(): fails.append('botão − GB deveria desabilitar em 0')
        if pg.input_value('#gb')!='0': fails.append('stepper − GB não deve ficar negativo: '+pg.input_value('#gb'))
    else: fails.append(f'steppers encontrados: {n}')
    # salvar/desfazer/restaurar
    reset_all(); pg.fill('#p','200'); pg.wait_for_timeout(60)
    if pg.locator('button:has-text("Salvar parâmetros")').is_disabled(): fails.append('Salvar deveria estar habilitado')
    pg.click('button:has-text("Salvar parâmetros")'); pg.wait_for_timeout(100)
    pg.reload(); pg.wait_for_timeout(300)
    if pg.input_value('#p')!='200': fails.append('parâmetro salvo não persistiu: '+pg.input_value('#p'))
    while pg.locator('aside details:not([open]) > summary').count(): pg.locator('aside details:not([open]) > summary').first.click()
    pg.fill('#p','300')
    if pg.locator('button:has-text("Desfazer")').count()==0: fails.append('sem botão Desfazer')
    else:
        pg.click('button:has-text("Desfazer")'); 
        if pg.input_value('#p')!='200': fails.append('Desfazer falhou')
    pg.fill('#ux','6'); pg.reload(); pg.wait_for_timeout(200)
    if pg.input_value('#ux')!='0': fails.append('pu não deveria ser salvo')
    pg.click('button:has-text("Restaurar padrão")'); pg.wait_for_timeout(100)
    if pg.input_value('#p')!='179': fails.append('Restaurar padrão falhou')
    while pg.locator('aside details:not([open]) > summary').count(): pg.locator('aside details:not([open]) > summary').first.click()
    # proposta: validação
    pg.click('button:has-text("Gerar PDF da proposta")'); pg.wait_for_timeout(200)
    t=pg.inner_text('body')
    for msg in ['Nome do contato obrigatório','Nome da empresa obrigatório','Telefone com DDD','E-mail inválido']:
        if msg not in t: fails.append('validação ausente: '+msg)
    pg.fill('#telefone','82999998888')
    if pg.input_value('#telefone')!='(82) 99999-8888': fails.append('máscara telefone: '+pg.input_value('#telefone'))
    pg.fill('#telefone','8233334444')
    if pg.input_value('#telefone')!='(82) 3333-4444': fails.append('máscara fixo: '+pg.input_value('#telefone'))
    pg.fill('#email','x@y'); pg.click('button:has-text("Gerar PDF da proposta")'); pg.wait_for_timeout(150)
    if 'E-mail inválido' not in pg.inner_text('body'): fails.append('email inválido aceito')
    # PDFs
    os.makedirs('/tmp/audit',exist_ok=True)
    def gen(mod,tag,pu=None,gb=None,extra=None):
        reset_all()
        if pu: pg.fill('#ux',str(pu))
        if gb: pg.fill('#gb',str(gb))
        pg.fill('#nome','Maria Souza'); pg.fill('#empresa','Studio Teste Arquitetura'); pg.fill('#telefone','82999998888'); pg.fill('#email','maria@studio.com.br')
        pg.get_by_label(re.compile(mod)).check()
        if extra:
            for k,v in extra.items(): pg.fill(f'#{k}',v)
        with pg.expect_download(timeout=20000) as d:
            pg.click('button:has-text("Gerar PDF da proposta")')
        path=f'/tmp/audit/{tag}.pdf'; d.value.save_as(path)
        txt=subprocess.run(['pdftotext','-layout',path,'-'],capture_output=True,text=True).stdout
        pages=int(re.search(r'Pages:\s+(\d+)',subprocess.run(['pdfinfo',path],capture_output=True,text=True).stdout).group(1))
        return txt,pages
    for mod,tag,pu,gb,ex in [('Mensal e anual','ambos',3,30,{'vendedor':'Rodrigo - Comercial','validade':'15','obs':'Início previsto em dezembro'}),
                              ('Apenas mensal','mensal',None,None,None),('Apenas anual','anual',1,None,None)]:
        txt,pages=gen(mod,tag,pu,gb,ex)
        o={'ux':pu or 0,'gb':gb or 0}; L,A,_,_=model(o)
        def f(v): return ('R$ '+f'{v:,.2f}'.replace(',','X').replace('.',',').replace('X','.'))
        need=['Maria Souza','Studio Teste Arquitetura','(82) 99999-8888','maria@studio.com.br','36.899.179/0001-08']
        if mod!='Apenas anual': need.append(f(L))
        if mod!='Apenas mensal': need.append(f(A))
        for n in need:
            if n not in txt: fails.append(f'PDF {tag}: faltou "{n}"')
        for forb in ['Lucro','margem','Margem','Custo fixo','cooperativa','Cooperativa','ISS','COFINS']:
            if forb in txt: fails.append(f'PDF {tag}: vazou "{forb}"')
        if tag=='ambos':
            for n in ['Rodrigo - Comercial','Início previsto em dezembro','Usuários adicionais','Armazenamento adicional']:
                if n not in txt: fails.append(f'PDF ambos: faltou "{n}"')
        if 'Pagamento' not in txt or 'Cartão de crédito' not in txt: fails.append(f'PDF {tag}: forma de pagamento ausente')
        if tag=='mensal' and 'Usuários adicionais' in txt: fails.append('PDF mensal: usuários adicionais indevido')
        print(tag,'páginas',pages)
    # mobile
    m=ctx.new_page(); m.set_viewport_size({'width':390,'height':844}); m.goto('http://localhost:4173/'); m.wait_for_timeout(300)
    sw=m.evaluate('document.documentElement.scrollWidth')
    if sw>390: fails.append(f'overflow horizontal mobile {sw}')
    b.close()
print('ok',passes,'falhas',len(fails)); [print(' -',x) for x in fails]
print('console:',errs)
