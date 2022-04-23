import { BsStarFill, BsStarHalf, BsStar } from 'react-icons/bs';

const FillStar = {
    FILL: 1,
    HALF: 2,
    NOFILL: 3,
}

const Star = ({ fill }) => {
    const styling = 'mx-1 text-accent-400'

    if (fill === FillStar.FILL) {
        return <BsStarFill className={styling} />
    } else if (fill === FillStar.HALF) {
        return <BsStarHalf className={styling} />
    } else {
        return <BsStar className={styling} />
    }
};


const Stars = ({count=5, rating=5}) => (
    <div className='flex justify-center'>
        {Array(count).fill().map((_, index) => {
            const key = index;
            if  ((index+1) > rating) {
                return <Star key={key} fill={FillStar.NOFILL} />
            }
            return <Star key={key} fill={FillStar.FILL} />
        })}
    </div>
);


export default Stars