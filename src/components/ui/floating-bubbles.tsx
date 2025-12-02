export default function FloatingBubbles() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Bubble 1 */}
      <div 
        className="absolute w-32 h-32 rounded-full bg-primary/10 animate-float-slow"
        style={{
          left: '10%',
          bottom: '-10%',
          animationDelay: '0s',
          animationDuration: '20s'
        }}
      />
      
      {/* Bubble 2 */}
      <div 
        className="absolute w-48 h-48 rounded-full bg-primary/5 animate-float-medium"
        style={{
          right: '15%',
          bottom: '-15%',
          animationDelay: '2s',
          animationDuration: '25s'
        }}
      />
      
      {/* Bubble 3 */}
      <div 
        className="absolute w-24 h-24 rounded-full bg-primary/8 animate-float-slow"
        style={{
          left: '25%',
          bottom: '-8%',
          animationDelay: '4s',
          animationDuration: '22s'
        }}
      />
      
      {/* Bubble 4 */}
      <div 
        className="absolute w-36 h-36 rounded-full bg-primary/6 animate-float-medium"
        style={{
          right: '30%',
          bottom: '-12%',
          animationDelay: '1s',
          animationDuration: '23s'
        }}
      />
      
      {/* Bubble 5 */}
      <div 
        className="absolute w-20 h-20 rounded-full bg-primary/10 animate-float-slow"
        style={{
          left: '50%',
          bottom: '-6%',
          animationDelay: '3s',
          animationDuration: '21s'
        }}
      />
      
      {/* Bubble 6 */}
      <div 
        className="absolute w-28 h-28 rounded-full bg-primary/7 animate-float-medium"
        style={{
          right: '5%',
          bottom: '-9%',
          animationDelay: '5s',
          animationDuration: '24s'
        }}
      />
    </div>
  )
}
