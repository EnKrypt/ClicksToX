interface LoadingScreenProps {
  error: { show: boolean; message: string };
}

const LoadingScreen = ({ error }: LoadingScreenProps) => {
  return (
    <>
      <div className="tab-menu">Loading...</div>
      <div className={error.show ? 'error-show' : 'error-hidden'}>
        {error.message}
      </div>
    </>
  );
};

export default LoadingScreen;
