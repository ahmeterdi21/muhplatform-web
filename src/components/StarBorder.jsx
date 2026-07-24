import './StarBorder.css';

const StarBorder = ({
  as: Component = 'button',
  className = '',
  innerClassName = '', // Tailwind sınıflarımızı iç butona aktarmak için eklendi
  color = 'white',
  speed = '4s', // Daha dinamik durması için varsayılanı 4s yaptım
  thickness = 2, // Kenarlığın daha belirgin olması için 2px yaptım
  children,
  ...rest
}) => {
  return (
    <Component
      className={`star-border-container ${className}`}
      style={{
        padding: `${thickness}px`,
        ...rest.style
      }}
      {...rest}
    >
      <div
        className="border-gradient-bottom"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed
        }}
      ></div>
      <div
        className="border-gradient-top"
        style={{
          background: `radial-gradient(circle, ${color}, transparent 10%)`,
          animationDuration: speed
        }}
      ></div>
      <div className={`inner-content ${innerClassName}`}>
        {children}
      </div>
    </Component>
  );
};

export default StarBorder;