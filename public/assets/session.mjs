for(const link of document.querySelectorAll('a[href="/auth.html?mode=logout"],a[href^="/signout-with-chatgpt"]'))link.addEventListener('click',async event=>{
 event.preventDefault();if(link.getAttribute('aria-disabled')==='true')return;link.setAttribute('aria-disabled','true');
 try{const response=await fetch('/api/auth/logout',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});if(!response.ok)throw new Error();const result=await response.json();location.assign(result.redirect==='/signout-with-chatgpt?return_to=%2F'?result.redirect:'/')}catch{link.removeAttribute('aria-disabled');alert('Не удалось выйти. Повторите попытку.')}
});
try{
 const response=await fetch('/api/auth/config',{cache:'no-store'}),config=await response.json();
 if(config.canLinkLegacy){const main=document.querySelector('main.content');if(main){const notice=document.createElement('div');notice.className='password-notice';notice.innerHTML='<strong>Вход по логину и паролю</strong><p>Подключите обычный вход к этому аккаунту. Ваши материалы и права сохранятся.</p><a class="text-button" href="/auth.html?mode=link">Установить логин и пароль →</a>';main.prepend(notice)}}
}catch{}
