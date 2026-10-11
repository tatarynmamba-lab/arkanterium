for(const link of document.querySelectorAll('a[href="/auth.html?mode=logout"],a[href^="/signout-with-chatgpt"]'))link.addEventListener('click',async event=>{
 event.preventDefault();if(link.getAttribute('aria-disabled')==='true')return;link.setAttribute('aria-disabled','true');
 try{const response=await fetch('/api/auth/logout',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});if(!response.ok)throw new Error();const result=await response.json();location.assign(result.redirect==='/signout-with-chatgpt?return_to=%2F'?result.redirect:'/')}catch{link.removeAttribute('aria-disabled');alert('Не удалось выйти. Повторите попытку.')}
});
