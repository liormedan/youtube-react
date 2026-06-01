// @ts-nocheck
import React, { useEffect, useRef } from 'react';
import './InfiniteScroll.scss';

export function InfiniteScroll(props) {
  const sentinelRef = useRef(null);

  useEffect(() => {
    if (!sentinelRef.current || !props.bottomReachedCallback) {
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          props.bottomReachedCallback();
        }
      });
    }, {
      rootMargin: '200px 0px',
    });

    observer.observe(sentinelRef.current);

    return () => {
      observer.disconnect();
    };
  }, [props.bottomReachedCallback]);

  return (
    <React.Fragment>
      {props.children}
      <div className='loader-container' ref={sentinelRef}>
        {props.showLoader && <div className='loader-container__spinner' aria-label='Loading' />}
      </div>
    </React.Fragment>
  );
}
