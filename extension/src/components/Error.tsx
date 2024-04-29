interface ErrorProps {
  error: {
    show: boolean;
    message: string;
  };
  hideError: () => void;
}

const Error = ({ error, hideError }: ErrorProps) => (
  <div className={error.show ? 'error show' : 'error hidden'}>
    <div className="message">{error.message}</div>
    <div className="close" onClick={() => hideError()}>
      ✖️
    </div>
  </div>
);

export default Error;
