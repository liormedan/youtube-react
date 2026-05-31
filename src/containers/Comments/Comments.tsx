// @ts-nocheck
import React from 'react';
import {CommentsHeader} from "./CommentsHeader/CommentsHeader";
import {Comment} from './Comment/Comment';
import {AddComment} from './AddComment/AddComment';

interface CommentsProps {
  amountComments: any;
  className?: string;
  comments: any[];
}

export class Comments extends React.Component<CommentsProps> {
  render() {
    if (!this.props.comments) {
      return <div/>;
    }

    const comments = this.props.comments.map((comment) => {
      return <Comment comment={comment} key={comment.id}/>
    });

    return(
      <div className={this.props.className}>
        <CommentsHeader amountComments={this.props.amountComments}/>
        <AddComment key='add-comment'/>
        {comments}
      </div>
    );
  }
}
