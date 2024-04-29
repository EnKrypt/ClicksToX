import Error from './Error';

interface LoadingScreenProps {
  error: { show: boolean; message: string };
  hideError: () => void;
}

const LoadingScreen = ({ error, hideError }: LoadingScreenProps) => {
  return (
    <div className="screen">
      <div className="loading"></div>
      <Error error={error} hideError={hideError} />
    </div>
  );
};

export default LoadingScreen;
