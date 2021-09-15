
export function trimToSize(source: string|null|undefined,size: number): string {
  if( !source) return "";
  if( source.length <= size ) return source;
  return source.substr(0, size-1) + "…";
}

export function padToSize(result: string,size: number,pattern = " "): string {
  while(result.length < size) result += pattern;
  return result;
}

export function getFileName(path: string): string {
  return path.split('\\').pop()?.split('/')?.pop() ?? "";
}

export function compactStringValue(value: number) {
  let result: string;
  if( value >= 100 )
    result = ""+Math.round(value);
  else if( value >= 10 )
    result =  value.toFixed(1);
  else if( value > 1)
    result = value.toFixed(2);
  else result = value.toFixed(3);
  if( result.indexOf('.') >= 0 ) {
    let endPos = result.length - 1;
    while (result[endPos] == '0' ) endPos--;
    if( result[endPos] == '.' ) endPos--;
    return result.substr(0, endPos+1);
  }
  return result;
}

const mutltiplyingPrefixes =   ['', 'K', 'M', 'T', 'P', 'E']

function bigSize(value: number, factor): string {
  for( const prefix of mutltiplyingPrefixes ) {
    if( value <= factor ) return compactStringValue(value) + prefix;
    value /= factor;
  }
  return compactStringValue(value)+mutltiplyingPrefixes[mutltiplyingPrefixes.length-1];
}

export function humanByteSize(size: number): string {
  return bigSize(size, 1024);
}
