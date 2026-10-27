// 全分辨率内嵌素材导出，离线也无需请求外部图片。
$('#download').onclick=()=>{
 const content=`<rect width="400" height="650" rx="20" fill="${sceneColors[state.scene]||sceneColors[0]}"/><g transform="translate(50 10)">${Art.doll(state)}</g><text x="200" y="634" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-size="14" fill="#906b79">My dream wardrobe</text>`;
 const url=URL.createObjectURL(new Blob([Art.svg(content,'0 0 400 650')],{type:'image/svg+xml;charset=utf-8'}));
 const image=new Image();
 image.onload=()=>{
  try{
   const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=1950;
   canvas.getContext('2d').drawImage(image,0,0,1200,1950);
   canvas.toBlob(blob=>{
    if(!blob){toast('图片生成失败，请重试');return}
    const link=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=link;a.download='芭比的心动穿搭.png';a.click();
    setTimeout(()=>URL.revokeObjectURL(link),3000);toast('穿搭图片已生成，查看浏览器下载');
   },'image/png');
  }catch{toast('图片下载失败，请使用 Chrome 或 Edge 重试')}
  finally{URL.revokeObjectURL(url)}
 };
 image.onerror=()=>{URL.revokeObjectURL(url);toast('图片生成失败，请重试')};image.src=url;
};
