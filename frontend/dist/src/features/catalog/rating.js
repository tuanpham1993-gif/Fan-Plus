export function optimisticRatingSummary(previous, value) {
    if (!Number.isInteger(value) || value < 1 || value > 5) {
        throw new Error("Choose a rating from 1 to 5.");
    }
    if (previous.userRating >= 1 && previous.userRating <= 5 && previous.count > 0) {
        return {
            userRating: value,
            count: previous.count,
            average: (previous.average * previous.count - previous.userRating + value) /
                previous.count,
        };
    }
    const count = previous.count + 1;
    return {
        userRating: value,
        count,
        average: (previous.average * previous.count + value) / count,
    };
}
