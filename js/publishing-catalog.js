// LeeWay / Leola's Library Publishing Catalog Adapter
export class PublishingCatalog {
  constructor(url='content/publishing/catalog.json'){this.url=url;this.data=null;}
  async load(){if(this.data)return this.data;const r=await fetch(this.url,{cache:'no-store'});if(!r.ok)throw new Error('Publishing catalog unavailable');this.data=await r.json();return this.data;}
  async books(){const c=await this.load();return c.books.filter(b=>b.status==='published'&&b.rights?.displayApproved).sort((a,b)=>(Number(b.premiere)-Number(a.premiere))||((a.premiereRank||999)-(b.premiereRank||999)));}
  async get(id){const c=await this.load();return c.books.find(b=>b.id===id)||null;}
}
