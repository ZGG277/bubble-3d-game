/* Minimal single-track AVC MP4 muxer. No B frames; fixed-rate; one contiguous chunk. */
(function (root) {
'use strict';
function cat(parts) { var n=parts.reduce(function(s,p){return s+p.length;},0),o=new Uint8Array(n),i=0;parts.forEach(function(p){o.set(p,i);i+=p.length;});return o; }
function bytes(){return new Uint8Array(arguments);}
function u32(n){return bytes(n>>>24,n>>>16,n>>>8,n);}
function u16(n){return bytes(n>>>8,n);}
function str(s){return new Uint8Array(s.split('').map(function(c){return c.charCodeAt(0);}));}
function zeros(n){return new Uint8Array(n);}
function box(t){var p=cat(Array.prototype.slice.call(arguments,1));return cat([u32(p.length+8),str(t),p]);}
function full(t,v,f){return box(t,bytes(v,f>>>16,f>>>8,f),cat(Array.prototype.slice.call(arguments,3)));}
function matrix(){return cat([u32(65536),u32(0),u32(0),u32(0),u32(65536),u32(0),u32(0),u32(0),u32(1073741824)]);}
function mux(samples,avcc,w,h,fps){
 if(!samples.length||!avcc||avcc.length<7)throw Error('缺少 AVC 配置或视频帧');
 samples.forEach(function(s,i){if(i&&s.timestamp<=samples[i-1].timestamp)throw Error('编码器输出重排序，本探针不支持 B 帧');});
 var scale=24000,delta=scale/fps,duration=samples.length*delta;
 var ftyp=box('ftyp',str('isom'),u32(512),str('isomiso2avc1mp41'));
 var mdat=box('mdat',cat(samples.map(function(s){return s.data;})));
 var mvhd=full('mvhd',0,0,u32(0),u32(0),u32(scale),u32(duration),u32(65536),u16(256),zeros(10),matrix(),zeros(24),u32(2));
 var tkhd=full('tkhd',0,7,u32(0),u32(0),u32(1),u32(0),u32(duration),zeros(8),u16(0),u16(0),u16(0),u16(0),matrix(),u32(w*65536),u32(h*65536));
 var mdhd=full('mdhd',0,0,u32(0),u32(0),u32(scale),u32(duration),u16(21956),u16(0));
 var hdlr=full('hdlr',0,0,u32(0),str('vide'),zeros(12),str('BubbleReplay\0'));
 var avc1=box('avc1',zeros(6),u16(1),zeros(16),u16(w),u16(h),u32(4718592),u32(4718592),u32(0),u16(1),zeros(32),u16(24),u16(65535),box('avcC',avcc));
 var stsd=full('stsd',0,0,u32(1),avc1), stts=full('stts',0,0,u32(1),u32(samples.length),u32(delta));
 var stsc=full('stsc',0,0,u32(1),u32(1),u32(samples.length),u32(1));
 var stsz=full('stsz',0,0,u32(0),u32(samples.length),cat(samples.map(function(s){return u32(s.data.length);})));
 var stco=full('stco',0,0,u32(1),u32(ftyp.length+8));
 var keys=[];samples.forEach(function(s,i){if(s.key)keys.push(u32(i+1));});
 var stss=full('stss',0,0,u32(keys.length),cat(keys));
 var stbl=box('stbl',stsd,stts,stsc,stsz,stco,stss);
 var dinf=box('dinf',full('dref',0,0,u32(1),full('url ',0,1)));
 var minf=box('minf',full('vmhd',0,1,zeros(8)),dinf,stbl);
 return cat([ftyp,mdat,box('moov',mvhd,box('trak',tkhd,box('mdia',mdhd,hdlr,minf)))]);
}
root.BubbleMP4={mux:mux};
})(typeof window==='undefined'?this:window);
